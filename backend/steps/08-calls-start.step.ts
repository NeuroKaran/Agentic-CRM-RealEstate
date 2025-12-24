import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { callLogs, aiAgents, users, leads, properties } from '../db/schema';
import { eq } from 'drizzle-orm';

// Validation schema
const startCallSchema = z.object({
    buyerId: z.string(),
    agentId: z.string(),
    agentType: z.enum(['ai', 'human']).default('ai'),
    propertyId: z.string().optional(),
    leadId: z.string().optional(),
});

export const config: ApiRouteConfig = {
    name: 'StartCall',
    type: 'api',
    path: '/api/calls/start',
    method: 'POST',
    emits: ['call.started'],
    flows: ['VoiceCRM'],
};

export const handler: Handlers['StartCall'] = async (req, { emit, logger }) => {
    try {
        const parsed = startCallSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { buyerId, agentId, agentType, propertyId, leadId } = parsed.data;

        // Verify buyer exists
        const buyer = await db.select().from(users).where(eq(users.id, buyerId)).get();
        if (!buyer) {
            return {
                status: 404,
                body: { error: 'Buyer not found' },
            };
        }

        // Verify agent exists
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
        } else {
            const agent = await db.select().from(users).where(eq(users.id, agentId)).get();
            if (!agent || agent.role !== 'agent') {
                return {
                    status: 404,
                    body: { error: 'Human Agent not found' },
                };
            }
        }

        // Verify property if provided
        if (propertyId) {
            const property = await db.select().from(properties).where(eq(properties.id, propertyId)).get();
            if (!property) {
                return {
                    status: 404,
                    body: { error: 'Property not found' },
                };
            }
        }

        // Verify lead if provided
        if (leadId) {
            const lead = await db.select().from(leads).where(eq(leads.id, leadId)).get();
            if (!lead) {
                return {
                    status: 404,
                    body: { error: 'Lead not found' },
                };
            }
        }

        // Create call log entry
        const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const now = new Date();

        await db.insert(callLogs).values({
            id: callId,
            agentId,
            agentType,
            buyerId,
            propertyId,
            leadId,
            startTime: now,
            transcript: JSON.stringify([]),
            status: 'in_progress',
        }).run();

        logger.info('Call started', { callId, buyerId, agentId, agentType });

        await (emit as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'call.started',
            data: { callId, buyerId, agentId, agentType, propertyId, leadId },
        });

        // Get agent details for response
        let agentDetails: { name: string; systemPrompt?: string } | null = null;
        if (agentType === 'ai') {
            const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).get();
            if (agent) {
                agentDetails = {
                    name: agent.name,
                    systemPrompt: agent.systemPrompt,
                };
            }
        } else {
            const agent = await db.select().from(users).where(eq(users.id, agentId)).get();
            if (agent) {
                agentDetails = { name: agent.name };
            }
        }

        return {
            status: 201,
            body: {
                message: 'Call initiated successfully',
                call: {
                    id: callId,
                    buyerId,
                    agentId,
                    agentType,
                    agentName: agentDetails?.name,
                    propertyId,
                    leadId,
                    startTime: now.toISOString(),
                    status: 'in_progress',
                },
                socket: {
                    namespace: '/calls',
                    room: `call:${callId}`,
                    events: {
                        subscribe: ['call_connected', 'agent_speak', 'call_ended'],
                        emit: ['call_start', 'voice_input', 'call_end'],
                    },
                },
            },
        };
    } catch (error) {
        logger.error('Error starting call', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
