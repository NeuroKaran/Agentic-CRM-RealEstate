import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { db } from '../db';
import { aiAgents } from '../db/schema';
import { eq } from 'drizzle-orm';

export const config: ApiRouteConfig = {
    name: 'ListAiAgents',
    type: 'api',
    path: '/api/ai-agents',
    method: 'GET',
    middleware: [corsMiddleware],
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['ListAiAgents'] = async (req, { logger }) => {
    try {
        const { sellerId } = req.queryParams;

        if (!sellerId) {
            return {
                status: 400,
                body: { error: 'sellerId is required' },
            };
        }

        const agents = await db.select().from(aiAgents).where(eq(aiAgents.sellerId, sellerId as string)).all();

        const formattedAgents = agents.map(agent => ({
            ...agent,
            voiceConfig: JSON.parse(agent.voiceConfig as string),
        }));

        return {
            status: 200,
            body: { agents: formattedAgents },
        };
    } catch (error) {
        logger.error('Error fetching AI agents', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
