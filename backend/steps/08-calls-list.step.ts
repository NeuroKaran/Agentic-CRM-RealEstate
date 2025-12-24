import { ApiRouteConfig, Handlers } from 'motia';
import { db } from '../db';
import { callLogs, aiAgents, users } from '../db/schema';
import { eq, desc, or } from 'drizzle-orm';

export const config: ApiRouteConfig = {
    name: 'ListCalls',
    type: 'api',
    path: '/api/calls',
    method: 'GET',
    emits: [],
    flows: ['VoiceCRM'],
};

export const handler: Handlers['ListCalls'] = async (req, { logger }) => {
    try {
        const query = req.queryParams as { sellerId?: string; agentId?: string; buyerId?: string; limit?: string };
        const { sellerId, agentId, buyerId, limit = '50' } = query;

        if (!sellerId && !agentId && !buyerId) {
            return {
                status: 400,
                body: { error: 'At least one of sellerId, agentId, or buyerId is required' },
            };
        }

        let calls: typeof callLogs.$inferSelect[] = [];

        if (agentId) {
            // Get calls for specific agent
            calls = await db
                .select()
                .from(callLogs)
                .where(eq(callLogs.agentId, agentId))
                .orderBy(desc(callLogs.startTime))
                .limit(parseInt(limit))
                .all();
        } else if (buyerId) {
            // Get calls for specific buyer
            calls = await db
                .select()
                .from(callLogs)
                .where(eq(callLogs.buyerId, buyerId))
                .orderBy(desc(callLogs.startTime))
                .limit(parseInt(limit))
                .all();
        } else if (sellerId) {
            // Get all AI agents for this seller, then get their calls
            const sellerAgents = await db
                .select()
                .from(aiAgents)
                .where(eq(aiAgents.sellerId, sellerId))
                .all();

            const agentIds = sellerAgents.map(a => a.id);

            if (agentIds.length > 0) {
                // Get calls for all seller's agents
                const allCalls: typeof callLogs.$inferSelect[] = [];
                for (const aid of agentIds) {
                    const agentCalls = await db
                        .select()
                        .from(callLogs)
                        .where(eq(callLogs.agentId, aid))
                        .orderBy(desc(callLogs.startTime))
                        .all();
                    allCalls.push(...agentCalls);
                }
                // Sort and limit
                calls = allCalls
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, parseInt(limit));
            }
        }

        // Enrich calls with agent and buyer details
        const enrichedCalls = await Promise.all(
            calls.map(async (call) => {
                let agentName = 'Unknown';

                if (call.agentType === 'ai') {
                    const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, call.agentId)).get();
                    agentName = agent?.name || 'Unknown AI Agent';
                } else {
                    const agent = await db.select().from(users).where(eq(users.id, call.agentId)).get();
                    agentName = agent?.name || 'Unknown Agent';
                }

                const buyer = await db.select().from(users).where(eq(users.id, call.buyerId)).get();

                // Parse transcript
                let transcript: unknown[] = [];
                try {
                    transcript = JSON.parse(call.transcript as string || '[]');
                } catch {
                    transcript = [];
                }

                return {
                    id: call.id,
                    agentId: call.agentId,
                    agentType: call.agentType,
                    agentName,
                    buyerId: call.buyerId,
                    buyerName: buyer?.name || 'Unknown',
                    propertyId: call.propertyId,
                    leadId: call.leadId,
                    startTime: new Date(call.startTime).toISOString(),
                    endTime: call.endTime ? new Date(call.endTime).toISOString() : null,
                    duration: call.duration,
                    durationFormatted: call.duration
                        ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                        : null,
                    status: call.status,
                    transcriptCount: transcript.length,
                };
            })
        );

        // Calculate statistics
        const completedCalls = enrichedCalls.filter(c => c.status === 'completed');
        const stats = {
            totalCalls: enrichedCalls.length,
            completedCalls: completedCalls.length,
            inProgressCalls: enrichedCalls.filter(c => c.status === 'in_progress').length,
            averageDuration: completedCalls.length > 0
                ? Math.round(completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls.length)
                : 0,
            totalTalkTime: completedCalls.reduce((sum, c) => sum + (c.duration || 0), 0),
        };

        logger.info('Listed calls', {
            sellerId,
            agentId,
            buyerId,
            count: enrichedCalls.length
        });

        return {
            status: 200,
            body: {
                calls: enrichedCalls,
                stats: {
                    ...stats,
                    averageDurationFormatted: `${Math.floor(stats.averageDuration / 60)}m ${stats.averageDuration % 60}s`,
                    totalTalkTimeFormatted: `${Math.floor(stats.totalTalkTime / 60)}m ${stats.totalTalkTime % 60}s`,
                },
            },
        };
    } catch (error) {
        logger.error('Error listing calls', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
