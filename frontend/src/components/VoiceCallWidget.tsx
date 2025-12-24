"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, Loader2, X, AlertCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";

type SpeechRecognitionInstance = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const generateCallId = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `call_${Date.now()}`;
};

interface VoiceCallWidgetProps {
    agentId: string;
    agentName: string;
    onClose: () => void;
    buyerId?: string;
    propertyId?: string;
    agentType?: "ai" | "human";
}

const VoiceCallWidget: React.FC<VoiceCallWidgetProps> = ({ agentId, agentName, onClose, buyerId, propertyId, agentType = "ai" }) => {
    const [status, setStatus] = useState<"connecting" | "connected" | "active" | "ended" | "error">("connecting");
    const [isMuted, setIsMuted] = useState(false);
    const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [speechSupported, setSpeechSupported] = useState(true);

    const socketRef = useRef<Socket | null>(null);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const synthRef = useRef<SpeechSynthesis | null>(null);
    const statusRef = useRef(status);
    const mutedRef = useRef(isMuted);
    const callIdRef = useRef<string>(generateCallId());
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3002";

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        mutedRef.current = isMuted;
    }, [isMuted]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const startListening = useCallback(() => {
        if (!speechSupported || !recognitionRef.current || isListening || statusRef.current !== "active" || mutedRef.current) return;
        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (e) {
            console.error("Failed to start listening:", e);
        }
    }, [isListening, speechSupported]);

    const sendVoiceInput = useCallback((text: string) => {
        if (!socketRef.current || !text.trim()) return;
        socketRef.current.emit("voice_input", {
            callId: callIdRef.current,
            text,
            isFinal: true,
        });
    }, []);

    const speak = useCallback((text: string) => {
        if (synthRef.current) {
            synthRef.current.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            const voices = synthRef.current.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Female") || v.lang === "en-GB");
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onstart = () => stopListening();
            utterance.onend = () => startListening();

            synthRef.current.speak(utterance);
        }
    }, [startListening, stopListening]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognitionCtor = (window as unknown as {
            SpeechRecognition?: SpeechRecognitionConstructor;
            webkitSpeechRecognition?: SpeechRecognitionConstructor;
        }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

        if (!SpeechRecognitionCtor) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSpeechSupported(false);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setErrorMessage("Your browser does not support voice input.");
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStatus("error");
            return;
        }

        recognitionRef.current = new SpeechRecognitionCtor();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            const text = event.results[event.results.length - 1][0].transcript;
            if (mutedRef.current) return;
            setTranscript(prev => [...prev, { role: "user", text }]);
            sendVoiceInput(text);
        };

        recognitionRef.current.onerror = (event: { error: string }) => {
            console.error("Recognition error:", event.error);
            setErrorMessage("Microphone access error. Please check your permissions.");
        };

        recognitionRef.current.onend = () => {
            setIsListening(false);
            if (statusRef.current === "active" && !mutedRef.current) {
                startListening();
            }
        };

        synthRef.current = window.speechSynthesis;

        return () => {
            stopListening();
            synthRef.current?.cancel();
        };
    }, [sendVoiceInput, startListening, stopListening]);

    useEffect(() => {
        const socket = io(`${socketUrl}/calls`, {
            path: "/socket.io",
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setStatus("connecting");
            setErrorMessage(null);
            socket.emit("call_start", {
                callId: callIdRef.current,
                buyerId: buyerId || "demo-buyer",
                agentId,
                agentType,
                propertyId,
            });
        });

        socket.on("call_connected", () => {
            setStatus("active");
            startListening();
        });

        const handleAgentMessage = (data: { text: string }) => {
            if (!data?.text) return;
            setTranscript(prev => [...prev, { role: "agent", text: data.text }]);
            speak(data.text);
        };

        socket.on("agent_speak", handleAgentMessage);
        socket.on("agent_response", handleAgentMessage);

        socket.on("call_ended", () => {
            setStatus("ended");
            stopListening();
        });

        socket.on("connect_error", (err) => {
            console.error("Socket connection error", err);
            setErrorMessage("Unable to connect to call service.");
            setStatus("error");
        });

        socket.on("error", (err) => {
            console.error("Socket error:", err);
            setErrorMessage("Call encountered an error.");
            setStatus("error");
        });

        return () => {
            socket.disconnect();
            stopListening();
            synthRef.current?.cancel();
        };
    }, [agentId, agentType, buyerId, propertyId, socketUrl, speak, startListening, stopListening]);

    const handleEndCall = () => {
        socketRef.current?.emit("call_end", { callId: callIdRef.current, reason: "user_ended" });
        setStatus("ended");
        setTimeout(onClose, 2000);
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[100] w-96 bg-matte-black text-white rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden"
        >
            <div className="p-8">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-gold rounded-2xl flex items-center justify-center text-matte-black">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-black tracking-tight text-lg">{agentName}</h4>
                            <p className="text-[10px] font-bold text-accent-gold uppercase tracking-[0.2em]">
                                {status === "active" ? "Live Conversation" : status}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="h-64 bg-white/5 rounded-[2rem] p-6 mb-4 overflow-y-auto space-y-4 custom-scrollbar">
                    {transcript.length === 0 && status === "active" && (
                        <div className="h-full flex flex-col items-center justify-center text-center text-white/40 italic">
                            <Volume2 className="w-8 h-8 mb-4 animate-pulse" />
                            <p className="text-sm">Listening... Say &quot;Hello&quot; to start</p>
                        </div>
                    )}
                    {transcript.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium ${msg.role === "user" ? "bg-accent-gold text-matte-black" : "bg-white/10 text-white"}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {status === "connecting" && (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-accent-gold animate-spin" />
                        </div>
                    )}
                </div>

                {errorMessage && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 mb-4">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <div className="flex justify-center gap-6">
                    <button
                        onClick={() => {
                            setIsMuted(!isMuted);
                            if (!isMuted) {
                                stopListening();
                            } else if (status === "active") {
                                startListening();
                            }
                        }}
                        className={`p-5 rounded-full transition-all ${isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"}`}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={handleEndCall}
                        className="p-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {status === "active" && (
                <div className="bg-accent-gold/10 px-8 py-3 border-t border-white/5 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-gold">Recording Transcript</span>
                </div>
            )}
        </motion.div>
    );
};

export default VoiceCallWidget;
