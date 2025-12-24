import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { z } from 'zod';
import { db } from '../db';
import { aiAgents, users, subscriptions, transactions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { mockPayment } from '../services/mockPayment';

// Validation schema
const hireAiAgentSchema = z.object({
    sellerId: z.string(),
    agentId: z.string(),
    plan: z.enum(['monthly', 'quarterly', 'yearly']),
    cardNumber: z.string(),
});

export const config: ApiRouteConfig = {
    name: 'HireAiAgent',
    type: 'api',
    path: '/api/ai-agents/hire',
    method: 'POST',
    middleware: [corsMiddleware],
    emits: ['agent_hired'],
    flows: ['CRM'],
};

export const handler: Handlers['HireAiAgent'] = async (req, { emit, logger }) => {
    try {
        const parsed = hireAiAgentSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { sellerId, agentId, plan, cardNumber } = parsed.data;

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

        // Check if agent is already hired (has active subscription)
        const existingSubscription = await db
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

        if (existingSubscription) {
            return {
                status: 409,
                body: { error: 'Agent already has an active subscription' },
            };
        }

        // Calculate pricing
        const pricing = mockPayment.getSubscriptionPricing(plan, 'ai');

        // Validate card
        const cardValidation = mockPayment.validateCard(cardNumber);
        if (!cardValidation.valid) {
            return {
                status: 400,
                body: { error: 'Invalid card', details: cardValidation.error },
            };
        }

        // Process payment
        const paymentResult = await mockPayment.charge({
            amount: pricing.totalAmount,
            currency: 'USD',
            cardNumber,
            description: `AI Agent subscription - ${plan} plan`,
        });

        if (!paymentResult.success) {
            return {
                status: 402,
                body: { error: 'Payment failed', details: paymentResult.error },
            };
        }

        // Create subscription
        const now = new Date();
        const periodEnd = mockPayment.calculatePeriodEnd(now, plan);
        const subscriptionId = `sub_${Date.now()}`;

        await db.insert(subscriptions).values({
            id: subscriptionId,
            sellerId,
            agentId,
            agentType: 'ai',
            plan,
            pricePerMonth: pricing.pricePerMonth,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
        }).run();

        // Record transaction
        const transactionId = `txn_${Date.now()}`;
        await db.insert(transactions).values({
            id: transactionId,
            sellerId,
            subscriptionId,
            amount: pricing.totalAmount,
            currency: 'USD',
            status: 'success',
            type: 'HIRE_AI',
            description: `AI Agent "${agent.name}" - ${plan} subscription`,
        }).run();

        // Update AI agent status
        await db
            .update(aiAgents)
            .set({ status: 'active' })
            .where(eq(aiAgents.id, agentId))
            .run();

        logger.info('AI Agent hired', { sellerId, agentId, subscriptionId, plan });

        await (emit as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'ai-agent.hired',
            data: { sellerId, agentId, subscriptionId, plan, transactionId },
        });

        return {
            status: 201,
            body: {
                message: 'AI Agent hired successfully',
                subscription: {
                    id: subscriptionId,
                    agentId,
                    agentName: agent.name,
                    plan,
                    pricePerMonth: pricing.pricePerMonth,
                    totalCharged: pricing.totalAmount,
                    discount: `${pricing.discount * 100}%`,
                    currentPeriodStart: now.toISOString(),
                    currentPeriodEnd: periodEnd.toISOString(),
                    status: 'active',
                },
                transaction: {
                    id: transactionId,
                    amount: pricing.totalAmount,
                    currency: 'USD',
                    status: 'success',
                },
            },
        };
    } catch (error) {
        logger.error('Error hiring AI agent', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
