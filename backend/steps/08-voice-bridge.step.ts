import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { corsMiddleware } from '../middleware/cors';

// Validation schema
const voiceBridgeSchema = z.object({
    callId: z.string(),
    text: z.string(),
    buyerId: z.string(),
    agentId: z.string(),
});

export const config: ApiRouteConfig = {
    name: 'VoiceBridge',
    type: 'api',
    path: '/api/voice/bridge',
    method: 'POST',
    middleware: [corsMiddleware],
    emits: ['voice.input.received'],
    flows: ['VoiceCRM'],
};

export const handler: Handlers['VoiceBridge'] = async (req, { emit, logger }) => {
    try {
        const parsed = voiceBridgeSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { callId, text, buyerId, agentId } = parsed.data;

        logger.info('Voice bridge received input', { callId, textPreview: text.substring(0, 50) });

        // Emit event for processing
        await (emit as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'voice.input.received',
            data: { callId, text, buyerId, agentId },
        });

        return {
            status: 200,
            body: { message: 'Voice input forwarded to processing' },
        };
    } catch (error) {
        logger.error('Error in voice bridge', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
