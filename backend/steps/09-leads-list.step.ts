import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { db } from '../db';
import { leads } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

// List Leads (GET)
export const config: ApiRouteConfig = {
    name: 'ListLeads',
    type: 'api',
    path: '/api/leads',
    method: 'GET',
    middleware: [corsMiddleware],
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['ListLeads'] = async (req, { logger }) => {
    try {
        const sellerId = req.queryParams.sellerId as string;

        if (!sellerId) {
            return {
                status: 400,
                body: { error: 'sellerId is required' },
            };
        }

        const results = await db
            .select()
            .from(leads)
            .where(eq(leads.sellerId, sellerId))
            .orderBy(desc(leads.createdAt))
            .all();

        return {
            status: 200,
            body: { leads: results },
        };
    } catch (error) {
        logger.error('Error fetching leads', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
