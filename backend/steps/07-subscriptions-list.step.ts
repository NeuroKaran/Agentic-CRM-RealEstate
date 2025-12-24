import { ApiRouteConfig, Handlers } from 'motia';
import { db } from '../db';
import { subscriptions, aiAgents, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const config: ApiRouteConfig = {
    name: 'ListSubscriptions',
    type: 'api',
    path: '/api/subscriptions',
    method: 'GET',
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['ListSubscriptions'] = async (req, { logger }) => {
    try {
        const sellerId = (req.queryParams as { sellerId?: string })?.sellerId;

        if (!sellerId) {
            return {
                status: 400,
                body: { error: 'sellerId query parameter is required' },
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

        // Get all subscriptions for this seller
        const sellerSubscriptions = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.sellerId, sellerId))
            .all();

        // Enrich with agent details
        const enrichedSubscriptions = await Promise.all(
            sellerSubscriptions.map(async (sub) => {
                if (sub.agentType === 'ai') {
                    const agent = await db
                        .select()
                        .from(aiAgents)
                        .where(eq(aiAgents.id, sub.agentId))
                        .get();

                    return {
                        ...sub,
                        currentPeriodStart: new Date(sub.currentPeriodStart).toISOString(),
                        currentPeriodEnd: new Date(sub.currentPeriodEnd).toISOString(),
                        createdAt: new Date(sub.createdAt).toISOString(),
                        agent: agent ? {
                            id: agent.id,
                            name: agent.name,
                            status: agent.status,
                        } : null,
                    };
                } else {
                    // Human agent - get from users table
                    const agent = await db
                        .select()
                        .from(users)
                        .where(eq(users.id, sub.agentId))
                        .get();

                    return {
                        ...sub,
                        currentPeriodStart: new Date(sub.currentPeriodStart).toISOString(),
                        currentPeriodEnd: new Date(sub.currentPeriodEnd).toISOString(),
                        createdAt: new Date(sub.createdAt).toISOString(),
                        agent: agent ? {
                            id: agent.id,
                            name: agent.name,
                            role: agent.role,
                        } : null,
                    };
                }
            })
        );

        logger.info('Listed subscriptions', { sellerId, count: enrichedSubscriptions.length });

        return {
            status: 200,
            body: {
                subscriptions: enrichedSubscriptions,
                total: enrichedSubscriptions.length,
            },
        };
    } catch (error) {
        logger.error('Error listing subscriptions', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
