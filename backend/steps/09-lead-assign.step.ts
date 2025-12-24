import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { leads, aiAgents, users, agentAssignments, subscriptions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema
const assignLeadSchema = z.object({
    agentId: z.string(),
    agentType: z.enum(['ai', 'human']),
});

export const config: ApiRouteConfig = {
    name: 'AssignLead',
    type: 'api',
    path: '/api/leads/:id/assign',
    method: 'POST',
    emits: ['lead.assigned'],
    flows: ['CRM'],
};

export const handler: Handlers['AssignLead'] = async (req, { emit, logger }) => {
    try {
        const leadId = req.pathParams.id;

        const parsed = assignLeadSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { agentId, agentType } = parsed.data;

        // Get lead
        const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
        if (!lead) {
            return {
                status: 404,
                body: { error: 'Lead not found' },
            };
        }

        // Verify agent exists and is active
        let agentName = '';

        if (agentType === 'ai') {
            const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).get();
            if (!agent) {
                return {
                    status: 404,
                    body: { error: 'AI Agent not found' },
                };
            }
            if (agent.status !== 'active') {
                return {
                    status: 400,
                    body: { error: 'AI Agent is not active' },
                };
            }

            // Verify agent has active subscription
            const subscription = await db
                .select()
                .from(subscriptions)
                .where(
                    and(
                        eq(subscriptions.agentId, agentId),
                        eq(subscriptions.status, 'active')
                    )
                )
                .get();

            if (!subscription) {
                return {
                    status: 400,
                    body: { error: 'AI Agent does not have an active subscription' },
                };
            }

            agentName = agent.name;
        } else {
            const agent = await db.select().from(users).where(eq(users.id, agentId)).get();
            if (!agent || agent.role !== 'agent') {
                return {
                    status: 404,
                    body: { error: 'Human Agent not found' },
                };
            }

            // Verify agent is assigned to the seller
            const assignment = await db
                .select()
                .from(agentAssignments)
                .where(
                    and(
                        eq(agentAssignments.agentId, agentId),
                        eq(agentAssignments.sellerId, lead.sellerId),
                        eq(agentAssignments.status, 'active')
                    )
                )
                .get();

            if (!assignment) {
                return {
                    status: 400,
                    body: { error: 'Agent is not assigned to this seller' },
                };
            }

            agentName = agent.name;

            // Increment leads assigned for human agent
            await db
                .update(agentAssignments)
                .set({ leadsAssigned: (assignment.leadsAssigned || 0) + 1 })
                .where(eq(agentAssignments.id, assignment.id))
                .run();
        }

        // Update lead status
        await db
            .update(leads)
            .set({ status: 'assigned' })
            .where(eq(leads.id, leadId))
            .run();

        logger.info('Lead assigned', { leadId, agentId, agentType });

        await (emit as unknown as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'lead.assigned',
            data: {
                leadId,
                agentId,
                agentType,
                agentName,
                buyerId: lead.buyerId,
                propertyId: lead.propertyId,
                sellerId: lead.sellerId,
            },
        });

        return {
            status: 200,
            body: {
                message: 'Lead assigned successfully',
                lead: {
                    id: leadId,
                    status: 'assigned',
                    assignedTo: {
                        agentId,
                        agentType,
                        agentName,
                    },
                },
            },
        };
    } catch (error) {
        logger.error('Error assigning lead', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
