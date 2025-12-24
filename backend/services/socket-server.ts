/**
 * Socket.io Server for Realtime Voice Call CRM
 * Handles WebSocket connections for voice call signaling
 * 
 * This module provides:
 * - Call session management
 * - Voice input/output signaling
 * - Active call tracking
 * - Transcript recording
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

// Types
export interface CallSession {
    callId: string;
    buyerId: string;
    agentId: string;
    agentType: 'ai' | 'human';
    propertyId?: string;
    leadId?: string;
    startTime: Date;
    transcript: TranscriptEntry[];
    status: 'connecting' | 'active' | 'ended';
}

export interface TranscriptEntry {
    role: 'buyer' | 'agent';
    content: string;
    timestamp: Date;
}

export interface VoiceInputPayload {
    callId: string;
    text: string;
    isFinal: boolean;
}

export interface AgentResponsePayload {
    callId: string;
    text: string;
    isFinal: boolean;
}

// Active call sessions storage
const activeCalls = new Map<string, CallSession>();

// Socket to call mapping
const socketToCall = new Map<string, string>();

// IO instance reference
let io: Server | null = null;

import { db } from '../db';
import { callLogs } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Initialize Socket.io server
 */
export function initializeSocketServer(httpServer: HTTPServer): Server {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        path: '/socket.io',
    });

    // Calls namespace
    const callsNamespace = io.of('/calls');

    callsNamespace.on('connection', (socket: Socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);

        // Handle call start
        socket.on('call_start', async (data: {
            callId: string;
            buyerId: string;
            agentId: string;
            agentType: 'ai' | 'human';
            propertyId?: string;
            leadId?: string;
        }) => {
            // Null check to prevent crashes
            if (!data || !data.callId || !data.buyerId || !data.agentId) {
                console.log('[Socket.io] Invalid call_start data received:', data);
                socket.emit('error', { message: 'Missing required fields: callId, buyerId, or agentId' });
                return;
            }

            try {
                // Check if call log already exists (to prevent duplicate entries)
                const existingLog = await db.select().from(callLogs).where(eq(callLogs.id, data.callId)).get();
                
                if (!existingLog) {
                    // Create call log entry in DB if it doesn't exist
                    await db.insert(callLogs).values({
                        id: data.callId,
                        agentId: data.agentId,
                        agentType: data.agentType,
                        buyerId: data.buyerId,
                        propertyId: data.propertyId,
                        leadId: data.leadId,
                        startTime: new Date(),
                        transcript: JSON.stringify([]),
                        status: 'in_progress',
                    }).run();
                    console.log(`[Socket.io] Created call log entry for ${data.callId}`);
                }

                const session: CallSession = {
                    callId: data.callId,
                    buyerId: data.buyerId,
                    agentId: data.agentId,
                    agentType: data.agentType,
                    propertyId: data.propertyId,
                    leadId: data.leadId,
                    startTime: new Date(),
                    transcript: [],
                    status: 'connecting',
                };

                activeCalls.set(data.callId, session);
                socketToCall.set(socket.id, data.callId);

                // Join call room
                socket.join(`call:${data.callId}`);

                // Update status to active
                session.status = 'active';

                // Emit call connected
                socket.emit('call_connected', {
                    callId: data.callId,
                    agentId: data.agentId,
                    agentType: data.agentType,
                    timestamp: new Date().toISOString(),
                });

                console.log(`[Socket.io] Call started: ${data.callId}`);
            } catch (error) {
                console.error('[Socket.io] Error starting call:', error);
                socket.emit('error', { message: 'Failed to initialize call session' });
            }
        });

        // Handle voice input from buyer
        socket.on('voice_input', async (data: VoiceInputPayload) => {
            // Comprehensive null check to prevent crashes
            if (!data || !data.callId || typeof data.text !== 'string') {
                console.log('[Socket.io] Invalid voice_input data received:', data);
                socket.emit('error', { message: 'Invalid voice_input: missing callId or text' });
                return;
            }

            const session = activeCalls.get(data.callId);
            if (!session) {
                console.log(`[Socket.io] Call session not found for voice_input: ${data.callId}`);
                socket.emit('error', { message: 'Call session not found' });
                return;
            }

            // Add to transcript
            session.transcript.push({
                role: 'buyer',
                content: data.text,
                timestamp: new Date(),
            });

            console.log(`[Socket.io] Voice input received for ${data.callId}: ${data.text.substring(0, 50)}...`);

            // Forward to Motia bridge for processing
            try {
                fetch('http://localhost:3000/api/voice/bridge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callId: data.callId,
                        text: data.text,
                        buyerId: session.buyerId,
                        agentId: session.agentId
                    })
                }).catch(err => console.error('[Socket.io] Bridge fetch error:', err));
            } catch (e) {
                console.error('[Socket.io] Error calling bridge:', e);
            }

            // Emit event for processing (will be handled by event step)
            // For now, emit to the room for acknowledgment
            socket.emit('voice_input_received', {
                callId: data.callId,
                acknowledged: true,
                timestamp: new Date().toISOString(),
            });
        });

        // Handle agent response (after LLM processing)
        socket.on('agent_response', (data: AgentResponsePayload) => {
            // Comprehensive null check to prevent crashes
            if (!data || !data.callId || typeof data.text !== 'string') {
                console.log('[Socket.io] Invalid agent_response data received:', data);
                socket.emit('error', { message: 'Invalid agent_response: missing callId or text' });
                return;
            }

            const session = activeCalls.get(data.callId);
            if (!session) {
                console.log(`[Socket.io] No session found for agent_response callId: ${data.callId}`);
                socket.emit('error', { message: 'Call session not found' });
                return;
            }

            // Add to transcript
            session.transcript.push({
                role: 'agent',
                content: data.text,
                timestamp: new Date(),
            });

            // Broadcast to all clients in the call room
            callsNamespace.to(`call:${data.callId}`).emit('agent_speak', {
                callId: data.callId,
                text: data.text,
                isFinal: data.isFinal ?? true,
                timestamp: new Date().toISOString(),
            });

            console.log(`[Socket.io] Agent response sent for call ${data.callId}`);
        });

        // Handle call end
        socket.on('call_end', (data: { callId: string; reason?: string }) => {
            // Null check to prevent crashes
            if (!data || !data.callId) {
                console.log('[Socket.io] Invalid call_end data received:', data);
                socket.emit('error', { message: 'Missing callId in call_end request' });
                return;
            }

            const session = activeCalls.get(data.callId);
            if (session) {
                session.status = 'ended';

                // Emit call ended event
                callsNamespace.to(`call:${data.callId}`).emit('call_ended', {
                    callId: data.callId,
                    duration: Math.floor((Date.now() - session.startTime.getTime()) / 1000),
                    reason: data.reason,
                    timestamp: new Date().toISOString(),
                });

                console.log(`[Socket.io] Call ended: ${data.callId}`);
            } else {
                console.log(`[Socket.io] Call session not found for call_end: ${data.callId}`);
            }

            // Leave room
            socket.leave(`call:${data.callId}`);
            socketToCall.delete(socket.id);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const callId = socketToCall.get(socket.id);
            if (callId) {
                const session = activeCalls.get(callId);
                if (session && session.status === 'active') {
                    session.status = 'ended';
                    callsNamespace.to(`call:${callId}`).emit('call_ended', {
                        callId,
                        reason: 'disconnect',
                        timestamp: new Date().toISOString(),
                    });
                }
                socketToCall.delete(socket.id);
            }
            console.log(`[Socket.io] Client disconnected: ${socket.id}`);
        });
    });

    console.log('[Socket.io] Server initialized');
    return io;
}

/**
 * Get active call session
 */
export function getCallSession(callId: string): CallSession | undefined {
    return activeCalls.get(callId);
}

/**
 * Get all active calls
 */
export function getAllActiveCalls(): CallSession[] {
    return Array.from(activeCalls.values()).filter(s => s.status === 'active');
}

/**
 * End a call session programmatically
 */
export function endCallSession(callId: string): CallSession | undefined {
    const session = activeCalls.get(callId);
    if (session) {
        session.status = 'ended';

        // Notify clients if io is available
        if (io) {
            io.of('/calls').to(`call:${callId}`).emit('call_ended', {
                callId,
                reason: 'server_terminated',
                timestamp: new Date().toISOString(),
            });
        }
    }
    return session;
}

/**
 * Send agent response to a call
 */
export function sendAgentResponse(callId: string, text: string, isFinal: boolean = true): boolean {
    const session = activeCalls.get(callId);
    if (!session || session.status !== 'active' || !io) {
        return false;
    }

    // Add to transcript
    session.transcript.push({
        role: 'agent',
        content: text,
        timestamp: new Date(),
    });

    // Emit to call room
    io.of('/calls').to(`call:${callId}`).emit('agent_speak', {
        callId,
        text,
        isFinal,
        timestamp: new Date().toISOString(),
    });

    return true;
}

/**
 * Get transcript for a call
 */
export function getTranscript(callId: string): TranscriptEntry[] {
    const session = activeCalls.get(callId);
    return session?.transcript || [];
}

/**
 * Clear ended sessions (cleanup)
 */
export function cleanupEndedSessions(): number {
    let cleaned = 0;
    for (const [callId, session] of activeCalls.entries()) {
        if (session.status === 'ended') {
            activeCalls.delete(callId);
            cleaned++;
        }
    }
    return cleaned;
}

export default {
    initializeSocketServer,
    getCallSession,
    getAllActiveCalls,
    endCallSession,
    sendAgentResponse,
    getTranscript,
    cleanupEndedSessions,
};
