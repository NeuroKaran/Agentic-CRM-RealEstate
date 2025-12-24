import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { aiAgents } from '../db/schema';
import { eq } from 'drizzle-orm';

const voiceConfigSchema = z.object({
    provider: z.string().optional(),
    voiceId: z.string().optional(),
    settings: z.record(z.any()).optional(),
});

const updateAgentSchema = z.object({
    name: z.string().optional(),
    systemPrompt: z.string().optional(),
    voiceConfig: voiceConfigSchema.optional(),
    status: z.enum(['active', 'inactive']).optional(),
});

export const config: ApiRouteConfig = {
    name: 'UpdateAiAgent',
    type: 'api',
    path: '/api/ai-agents/:id',
    method: 'PUT',
    emits: ['agent.updated'],
    flows: ['CRM'],
};

export const handler: Handlers['UpdateAiAgent'] = async (req, { emit, logger }) => {
    try {
        const { id } = req.pathParams;
        const parsed = updateAgentSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const updates = parsed.data;
        const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, id)).get();

        if (!agent) {
            return {
                status: 404,
                body: { error: 'Agent not found' },
            };
        }

        const updateData: any = { ...updates };
        if (updates.voiceConfig) {
            updateData.voiceConfig = JSON.stringify(updates.voiceConfig);
        }

        await db.update(aiAgents).set(updateData).where(eq(aiAgents.id, id)).run();

        logger.info('AI Agent updated', { agentId: id });

        await (emit as any)({
            topic: 'agent.updated',
            data: { agentId: id, updates },
        });

        return {
            status: 200,
            body: { message: 'AI Agent updated successfully' },
        };
    } catch (error) {
        logger.error('Error updating AI agent', { error });
        return {
            status: 500,
            body: { error: 'Internal server error', details: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
        };
    }
};
