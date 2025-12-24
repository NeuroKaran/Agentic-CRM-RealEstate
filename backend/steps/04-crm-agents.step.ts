import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { users, agentAssignments } from '../db/schema';
import { eq } from 'drizzle-orm';

// Validation schema for hiring an agent
const hireAgentSchema = z.object({
    sellerId: z.string(),
    agentId: z.string(),
    subscription: z.enum(['monthly', 'quarterly', 'yearly']),
});

// Hire Agent (POST)
export const config: ApiRouteConfig = {
    name: 'HireAgent',
    type: 'api',
    path: '/api/crm/agents',
    method: 'POST',
    emits: ['agent.hired'],
    flows: ['CRM'], // Matches user edit
};

export const handler: Handlers['HireAgent'] = async (req, { emit, logger }) => {
    try {
        const parsed = hireAgentSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { sellerId, agentId, subscription } = parsed.data;

        // Check if agent exists
        const agent = await db.select().from(users).where(eq(users.id, agentId)).get();
        if (!agent || agent.role !== 'agent') {
            return {
                status: 404,
                body: { error: 'Agent not found' },
            };
        }

        // Check if seller exists
        const seller = await db.select().from(users).where(eq(users.id, sellerId)).get();
        if (!seller || seller.role !== 'seller') {
            return {
                status: 404,
                body: { error: 'Seller not found' },
            };
        }

        const assignmentId = `assign_${Date.now()}`;
        const assignment = {
            id: assignmentId,
            sellerId,
            agentId,
            agentName: agent.name,
            subscription,
            status: 'active',
            leadsAssigned: 0,
            conversions: 0,
        };

        // Store assignment
        await db.insert(agentAssignments).values(assignment).run();

        logger.info('Agent hired', { sellerId, agentId, assignmentId });

        // Emit agent hired event
        await (emit as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'agent.hired',
            data: { sellerId, agentId, assignmentId },
        });

        return {
            status: 201,
            body: { message: 'Agent hired successfully', assignment },
        };
    } catch (error) {
        logger.error('Error hiring agent', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
