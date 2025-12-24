import { db } from '../db';
import { aiAgents, callLogs } from '../db/schema';
import { eq } from 'drizzle-orm';
import socketServer from '../services/socket-server';

/**
 * Event handler for processing voice input through LLM
 * This step receives text from buyer's speech-to-text and generates AI response
 */

interface EventConfig {
    name: string;
    type: 'event';
    subscribes: string[];
    emits: string[];
    flows?: string[];
}

export const config: EventConfig = {
    name: 'ProcessVoiceInput',
    type: 'event',
    subscribes: ['voice.input.received'],
    emits: ['voice.response.ready'],
    flows: ['VoiceCRM'],
};

interface VoiceInputEvent {
    callId: string;
    text: string;
    buyerId: string;
    agentId: string;
}

interface EventContext {
    emit: (args: { topic: string; data: unknown }) => Promise<void>;
    logger: {
        info: (message: string, meta?: Record<string, unknown>) => void;
        warn: (message: string, meta?: Record<string, unknown>) => void;
        error: (message: string, meta?: Record<string, unknown>) => void;
    };
}

export const handler = async (input: VoiceInputEvent, { emit, logger }: EventContext): Promise<void> => {
    try {
        const { callId, text, buyerId, agentId } = input;

        logger.info('Processing voice input', { callId, textPreview: text.substring(0, 50) });

        // Get AI agent configuration
        const agent = await db.select().from(aiAgents).where(eq(aiAgents.id, agentId)).get();
        if (!agent) {
            logger.error('AI Agent not found for voice processing', { agentId });
            return;
        }

        // Get call context
        const callLog = await db.select().from(callLogs).where(eq(callLogs.id, callId)).get();
        if (!callLog) {
            logger.error('Call log not found', { callId });
            return;
        }

        // Get existing transcript for context
        let transcript: { role: string; content: string }[] = [];
        try {
            transcript = JSON.parse(callLog.transcript as string || '[]');
        } catch {
            transcript = [];
        }

        // Prepare conversation history for LLM
        const conversationHistory = transcript.map(t => ({
            role: t.role === 'buyer' ? 'user' : 'assistant',
            content: t.content,
        }));

        // Add current input
        conversationHistory.push({ role: 'user', content: text });

        /**
         * LLM Integration Point
         * 
         * In a production environment, this would call an LLM API
         * (OpenAI, Gemini, Claude, or local Ollama) with:
         * - System prompt from agent.systemPrompt
         * - Conversation history for context
         * - Current user message
         * 
         * For now, we generate a contextual mock response
         */
        const responseText = generateMockResponse(agent.systemPrompt, text, agent.name);

        // Send response to client via WebSocket
        const sent = socketServer.sendAgentResponse(callId, responseText, true);

        if (!sent) {
            logger.warn('Could not send response to socket', { callId });
        }

        // Update transcript in call log
        transcript.push({ role: 'buyer', content: text });
        transcript.push({ role: 'agent', content: responseText });

        await db
            .update(callLogs)
            .set({ transcript: JSON.stringify(transcript) })
            .where(eq(callLogs.id, callId))
            .run();

        // Emit response event
        await emit({
            topic: 'voice.response.ready',
            data: {
                callId,
                buyerId,
                agentId,
                inputText: text,
                responseText,
            },
        });

        logger.info('Voice response sent', { callId, responseLength: responseText.length });

    } catch (error) {
        logger.error('Error processing voice input', { error });
    }
};

/**
 * Generate a mock AI response based on context
 * This would be replaced with actual LLM call in production
 */
function generateMockResponse(systemPrompt: string, userMessage: string, agentName: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Property-related responses
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
        return `I'd be happy to discuss pricing with you. Our properties range from budget-friendly options to premium listings. Could you tell me more about your budget range so I can recommend the best options for you?`;
    }

    if (lowerMessage.includes('location') || lowerMessage.includes('area')) {
        return `Great question about location! We have properties in various neighborhoods - from bustling city centers to quiet suburban areas. What type of environment are you looking for?`;
    }

    if (lowerMessage.includes('bedroom') || lowerMessage.includes('room')) {
        return `For bedrooms, we have options ranging from cozy studios to spacious 5-bedroom homes. How many bedrooms would work best for your needs?`;
    }

    if (lowerMessage.includes('visit') || lowerMessage.includes('tour') || lowerMessage.includes('see')) {
        return `Absolutely! I can schedule a property tour for you. Would you prefer an in-person visit or shall I arrange a virtual walkthrough first? What day works best for you?`;
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return `Hello! I'm ${agentName}, your AI real estate assistant. I'm here to help you find your perfect property. What type of property are you interested in today?`;
    }

    if (lowerMessage.includes('thank')) {
        return `You're welcome! Is there anything else I can help you with regarding your property search? I'm here to assist you.`;
    }

    if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
        return `That's exciting that you're looking to buy! To help you find the perfect property, could you share what's most important to you - location, size, or budget? I'll make sure to prioritize those in my recommendations.`;
    }

    // Default contextual response
    return `I understand you're asking about "${userMessage.substring(0, 30)}...". As your AI assistant, I'm here to help with all your property questions. Would you like me to provide more details about our available listings, schedule a tour, or discuss specific requirements?`;
}


