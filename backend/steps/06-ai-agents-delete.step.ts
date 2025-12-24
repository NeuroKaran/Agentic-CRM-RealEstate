import { ApiRouteConfig, Handlers } from 'motia';
import { db } from '../db';
import { aiAgents } from '../db/schema';
import { eq } from 'drizzle-orm';

export const config: ApiRouteConfig = {
    name: 'DeleteAiAgent',
    type: 'api',
    path: '/api/ai-agents/:id',
    method: 'DELETE',
    emits: ['agent.deleted'],
    flows: ['CRM'],
};

export const handler: Handlers['DeleteAiAgent'] = async (req, { emit, logger }) => {
    try {
        const { id } = req.pathParams;
        const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, id)).get();

        if (!agent) {
            return {
                status: 404,
                body: { error: 'Agent not found' },
            };
        }

        await db.delete(aiAgents).where(eq(aiAgents.id, id)).run();

        logger.info('AI Agent deleted', { agentId: id });

        await (emit as unknown as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'agent.deleted',
            data: { agentId: id },
        });

        return {
            status: 200,
            body: { message: 'AI Agent deleted successfully' },
        };
    } catch (error) {
        logger.error('Error deleting AI agent', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
