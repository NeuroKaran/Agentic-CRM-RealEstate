import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { aiAgents, users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Validation schema
const voiceConfigSchema = z.object({
    provider: z.string().optional(),
    voiceId: z.string().optional(),
    settings: z.record(z.any()).optional(),
});

const createAgentSchema = z.object({
    sellerId: z.string(),
    name: z.string(),
    systemPrompt: z.string(),
    voiceConfig: voiceConfigSchema.optional().default({}),
});

export const config: ApiRouteConfig = {
    name: 'CreateAiAgent',
    type: 'api',
    path: '/api/ai-agents',
    method: 'POST',
    emits: ['agent.created'],
    flows: ['CRM'],
};

export const handler: Handlers['CreateAiAgent'] = async (req, { emit, logger }) => {
    try {
        const parsed = createAgentSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { sellerId, name, systemPrompt, voiceConfig } = parsed.data;

        // Check if seller exists
        const seller = await db.select().from(users).where(eq(users.id, sellerId)).get();
        if (!seller || seller.role !== 'seller') {
            return {
                status: 404,
                body: { error: 'Seller not found' },
            };
        }

        const agentId = `ai_agent_${Date.now()}`;
        const newAgent = {
            id: agentId,
            sellerId,
            name,
            voiceConfig: JSON.stringify(voiceConfig),
            systemPrompt,
            status: 'active',
        };

        await db.insert(aiAgents).values(newAgent).run();

        logger.info('AI Agent created', { sellerId, agentId });

        await (emit as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'agent.created',
            data: { sellerId, agentId, name },
        });

        return {
            status: 201,
            body: { message: 'AI Agent created successfully', agent: { ...newAgent, voiceConfig } },
        };
    } catch (error) {
        logger.error('Error creating AI agent', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
