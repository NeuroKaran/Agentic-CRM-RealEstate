import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { callLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import socketServer from '../services/socket-server';

// Validation schema
const endCallSchema = z.object({
    reason: z.string().optional(),
});

export const config: ApiRouteConfig = {
    name: 'EndCall',
    type: 'api',
    path: '/api/calls/:id/end',
    method: 'POST',
    emits: ['call.ended'],
    flows: ['VoiceCRM'],
};

export const handler: Handlers['EndCall'] = async (req, { emit, logger }) => {
    try {
        const callId = req.pathParams.id;

        const parsed = endCallSchema.safeParse(req.body);
        const reason = parsed.success ? parsed.data.reason : undefined;

        // Get call log
        const callLog = await db.select().from(callLogs).where(eq(callLogs.id, callId)).get();
        if (!callLog) {
            return {
                status: 404,
                body: { error: 'Call not found' },
            };
        }

        if (callLog.status === 'completed') {
            return {
                status: 400,
                body: { error: 'Call already ended' },
            };
        }

        // Get transcript from socket server if available
        const transcript = socketServer.getTranscript(callId);

        // End call session in socket server
        socketServer.endCallSession(callId);

        // Calculate duration
        const endTime = new Date();
        const startTime = new Date(callLog.startTime);
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        // Update call log
        await db
            .update(callLogs)
            .set({
                endTime,
                duration,
                transcript: JSON.stringify(transcript.length > 0 ? transcript : JSON.parse(callLog.transcript as string || '[]')),
                status: 'completed',
            })
            .where(eq(callLogs.id, callId))
            .run();

        logger.info('Call ended', { callId, duration, reason });

        await (emit as unknown as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'call.ended',
            data: {
                callId,
                buyerId: callLog.buyerId,
                agentId: callLog.agentId,
                agentType: callLog.agentType,
                duration,
                reason,
            },
        });

        return {
            status: 200,
            body: {
                message: 'Call ended successfully',
                call: {
                    id: callId,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    duration,
                    durationFormatted: `${Math.floor(duration / 60)}m ${duration % 60}s`,
                    status: 'completed',
                    transcriptEntries: transcript.length,
                },
            },
        };
    } catch (error) {
        logger.error('Error ending call', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
