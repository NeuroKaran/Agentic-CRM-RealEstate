import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { db } from '../db';
import { properties, leads, aiAgents } from '../db/schema';
import { eq } from 'drizzle-orm';

// Analytics endpoint (GET)
export const config: ApiRouteConfig = {
    name: 'GetAnalytics',
    type: 'api',
    path: '/api/analytics',
    method: 'GET',
    middleware: [corsMiddleware],
    emits: [],
    flows: ['CRM'], // Matches user edit
};

export const handler: Handlers['GetAnalytics'] = async (req, { logger }) => {
    try {
        const sellerId = req.queryParams.sellerId as string;

        if (!sellerId) {
            return {
                status: 400,
                body: { error: 'sellerId is required' },
            };
        }

        // Get seller's properties
        const sellerProperties = await db.select().from(properties).where(eq(properties.sellerId, sellerId)).all();

        let totalViews = 0;
        let totalInquiries = 0;
        const formattedProperties = sellerProperties.map(p => {
            totalViews += p.views || 0;
            totalInquiries += p.inquiries || 0;
            return {
                id: p.id,
                title: p.title,
                views: p.views || 0,
                inquiries: p.inquiries || 0,
                status: p.status,
            };
        });

        // Get seller's leads
        const sellerLeads = await db.select().from(leads).where(eq(leads.sellerId, sellerId)).all();
        const newLeads = sellerLeads.filter(l => l.status === 'new').length;
        const convertedLeads = sellerLeads.filter(l => l.status === 'converted').length;

        // Get seller's AI agents (from aiAgents table, not agentAssignments)
        const sellerAgents = await db.select().from(aiAgents).where(eq(aiAgents.sellerId, sellerId)).all();
        const formattedAgents = sellerAgents.filter(a => a.status === 'active').map(a => ({
            id: a.id,
            agentName: a.name,
            status: a.status,
            createdAt: a.createdAt,
        }));

        const conversionRate = totalInquiries > 0
            ? ((convertedLeads / totalInquiries) * 100).toFixed(2)
            : '0.00';

        logger.info('Analytics fetched', { sellerId, totalProperties: formattedProperties.length });

        return {
            status: 200,
            body: {
                overview: {
                    totalProperties: formattedProperties.length,
                    totalViews,
                    totalInquiries,
                    newLeads,
                    convertedLeads,
                    conversionRate: `${conversionRate}%`,
                    activeAgents: formattedAgents.length,
                },
                properties: formattedProperties,
                agents: formattedAgents,
            },
        };
    } catch (error) {
        logger.error('Error fetching analytics', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
