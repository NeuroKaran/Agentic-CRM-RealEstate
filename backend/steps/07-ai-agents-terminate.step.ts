import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { z } from 'zod';
import { db } from '../db';
import { aiAgents, users, subscriptions, transactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { mockPayment } from '../services/mockPayment';

// Validation schema
const terminateAiAgentSchema = z.object({
    sellerId: z.string(),
    reason: z.string().optional(),
    immediateTermination: z.boolean().optional().default(false),
});

export const config: ApiRouteConfig = {
    name: 'TerminateAiAgent',
    type: 'api',
    path: '/api/ai-agents/:id/terminate',
    method: 'POST',
    middleware: [corsMiddleware],
    emits: ['agent_terminated'],
    flows: ['CRM'],
};
export const handler: Handlers['TerminateAiAgent'] = async (req, { emit, logger }) => {
    try {
        const { id: agentId } = req.pathParams;

        const parsed = terminateAiAgentSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { sellerId, reason, immediateTermination } = parsed.data;

        // Check if seller exists
        const seller = await db.select().from(users).where(eq(users.id, sellerId)).get();
        if (!seller || seller.role !== 'seller') {
            return {
                status: 404,
                body: { error: 'Seller not found' },
            };
        }

        // Check if AI agent exists
        const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).get();
        if (!agent) {
            return {
                status: 404,
                body: { error: 'AI Agent not found' },
            };
        }

        // Check if agent belongs to seller
        if (agent.sellerId !== sellerId) {
            return {
                status: 403,
                body: { error: 'Agent does not belong to this seller' },
            };
        }

        // Find active subscription
        const subscription = await db
            .select()
            .from(subscriptions)
            .where(
                and(
                    eq(subscriptions.agentId, agentId),
                    eq(subscriptions.sellerId, sellerId),
                    eq(subscriptions.status, 'active')
                )
            )
            .get();

        if (!subscription) {
            return {
                status: 404,
                body: { error: 'No active subscription found for this agent' },
            };
        }

        let refundAmount = 0;
        let refundTransactionId: string | null = null;

        // Calculate and process refund if immediate termination
        if (immediateTermination) {
            refundAmount = mockPayment.calculateProratedRefund(
                subscription.pricePerMonth,
                new Date(subscription.currentPeriodStart),
                new Date(subscription.currentPeriodEnd)
            );

            if (refundAmount > 0) {
                // Record refund transaction
                refundTransactionId = `txn_refund_${Date.now()}`;
                await db.insert(transactions).values({
                    id: refundTransactionId,
                    sellerId,
                    subscriptionId: subscription.id,
                    amount: -refundAmount, // negative for refund
                    currency: 'USD',
                    status: 'success',
                    type: 'REFUND',
                    description: `Prorated refund for AI Agent "${agent.name}" termination`,
                }).run();
            }

            // Update subscription status immediately
            await db
                .update(subscriptions)
                .set({ status: 'cancelled' })
                .where(eq(subscriptions.id, subscription.id))
                .run();

            // Update AI agent status
            await db
                .update(aiAgents)
                .set({ status: 'inactive' })
                .where(eq(aiAgents.id, agentId))
                .run();
        } else {
            // Schedule cancellation at period end
            await db
                .update(subscriptions)
                .set({ status: 'cancelled' })
                .where(eq(subscriptions.id, subscription.id))
                .run();
        }

        logger.info('AI Agent subscription terminated', {
            sellerId,
            agentId,
            subscriptionId: subscription.id,
            immediateTermination,
            refundAmount,
        });

        await (emit as unknown as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'ai-agent.terminated',
            data: {
                sellerId,
                agentId,
                subscriptionId: subscription.id,
                reason,
                immediateTermination,
                refundAmount,
            },
        });

        return {
            status: 200,
            body: {
                message: immediateTermination
                    ? 'AI Agent terminated immediately'
                    : 'AI Agent scheduled for termination at period end',
                subscription: {
                    id: subscription.id,
                    status: 'cancelled',
                    effectiveDate: immediateTermination
                        ? new Date().toISOString()
                        : new Date(subscription.currentPeriodEnd).toISOString(),
                },
                refund: refundAmount > 0 ? {
                    transactionId: refundTransactionId,
                    amount: refundAmount,
                    currency: 'USD',
                } : null,
            },
        };
    } catch (error) {
        logger.error('Error terminating AI agent', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
