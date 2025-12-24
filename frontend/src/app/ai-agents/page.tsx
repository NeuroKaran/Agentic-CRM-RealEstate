"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Bot,
    Settings2,
    Play,
    Pause,
    MessageSquare,
    Mic,
    TrendingUp,
    Sparkles,
    Loader2 as LucideLoader2
} from "lucide-react";
import Button from "@/components/ui/Button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface AIAgent {
    id: string;
    name: string;
    status: string;
    systemPrompt: string;
    voiceConfig: {
        provider: string;
        voiceId: string;
    };
    calls?: number;
    rating?: number;
}

const AiAgentsContent = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [agents, setAgents] = React.useState<AIAgent[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showHireModal, setShowHireModal] = React.useState(false);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [selectedAgent, setSelectedAgent] = React.useState<AIAgent | null>(null);
    const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
    const [cardNumber, setCardNumber] = React.useState("");
    const [submitting, setSubmitting] = React.useState(false);

    // New/Edit Agent Form State
    const [agentData, setAgentData] = React.useState({
        name: "",
        systemPrompt: "You are a helpful real estate assistant.",
        voiceId: "rachel"
    });

    const fetchAgents = React.useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/ai-agents?sellerId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setAgents(data.agents);
            }
        } catch (error) {
            console.error("Error fetching agents:", error);
            showToast("Failed to fetch agents.", "error");
        } finally {
            setLoading(false);
        }
    }, [user?.id, showToast]);

    React.useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const handleCreateAgent = async () => {
        if (!user?.id) return;

        try {
            setSubmitting(true);
            const response = await fetch('http://localhost:3000/api/ai-agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: user.id,
                    name: agentData.name,
                    systemPrompt: agentData.systemPrompt,
                    voiceConfig: {
                        provider: 'elevenlabs',
                        voiceId: agentData.voiceId
                    }
                })
            });

            if (response.ok) {
                showToast("New AI Staff created successfully!", "success");
                setShowCreateModal(false);
                setAgentData({ name: "", systemPrompt: "You are a helpful real estate assistant.", voiceId: "rachel" });
                fetchAgents();
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to create agent', "error");
            }
        } catch (error) {
            showToast("Error creating agent.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateAgent = async () => {
        if (!selectedAgent) return;

        try {
            setSubmitting(true);
            const response = await fetch(`http://localhost:3000/api/ai-agents/${selectedAgent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: agentData.name,
                    systemPrompt: agentData.systemPrompt,
                    voiceConfig: {
                        provider: 'elevenlabs',
                        voiceId: agentData.voiceId
                    }
                })
            });

            if (response.ok) {
                showToast("AI Agent updated successfully!", "success");
                setShowEditModal(false);
                fetchAgents();
            } else {
                const data = await response.json();
                showToast(data.error || 'Failed to update agent', "error");
            }
        } catch (error) {
            showToast("Error updating agent.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleHire = async (agentId: string) => {
        if (!user?.id) return;

        try {
            setSubmitting(true);
            const response = await fetch('http://localhost:3000/api/ai-agents/hire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: user.id,
                    agentId,
                    plan: selectedPlan,
                    cardNumber
                })
            });

            if (response.ok) {
                showToast("Agent hired successfully!", "success");
                setShowHireModal(false);
                fetchAgents();
            } else {
                const errorData = await response.json();
                showToast(errorData.error || 'Failed to hire agent', "error");
            }
        } catch (error) {
            showToast("An error occurred. Please try again.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleTerminate = async (agentId: string) => {
        if (!user?.id) return;

        // Custom confirmation logic could be added here, using a toast or modal
        // For now, we'll keep the logic but maybe use a more modern confirmation UI if needed.
        // But the user asked to fix buttons, so let's focus on functionality.

        try {
            const response = await fetch(`http://localhost:3000/api/ai-agents/${agentId}/terminate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId: user.id, immediate: true })
            });

            if (response.ok) {
                showToast("Subscription terminated.", "success");
                fetchAgents();
            }
        } catch (error) {
            console.error("Error terminating agent:", error);
            showToast("Error terminating agent.", "error");
        }
    };

    const openEditModal = (agent: AIAgent) => {
        setSelectedAgent(agent);
        setAgentData({
            name: agent.name,
            systemPrompt: agent.systemPrompt,
            voiceId: agent.voiceConfig.voiceId
        });
        setShowEditModal(true);
    };

    return (
        <section className="pt-40 pb-32 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Hero Header */}
                <div className="grid lg:grid-cols-2 gap-12 items-end mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-2 text-accent-gold font-bold tracking-[0.4em] uppercase text-xs mb-6">
                            <Sparkles className="w-4 h-4" />
                            Next-Gen Sales Force
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-matte-black leading-[0.9] tracking-tighter mb-8 italic">
                            AUTOMATED <br /> CONVERSATION.
                        </h1>
                        <p className="text-lg text-matte-black/60 leading-relaxed font-medium">
                            Deploy advanced AI agents to handle 24/7 buyer inquiries, schedule viewings, and close leads with human-like precision.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass p-8 rounded-[3rem] border-white/40 flex items-center justify-between"
                    >
                        <div>
                            <p className="text-4xl font-black text-matte-black">8.2k</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-matte-black/40">Calls this month</p>
                        </div>
                        <div className="h-12 w-[1px] bg-matte-black/10" />
                        <div>
                            <p className="text-4xl font-black text-matte-black">94%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-matte-black/40">Buyer Satisfaction</p>
                        </div>
                        <div className="h-12 w-[1px] bg-matte-black/10" />
                        <div className="w-16 h-16 bg-matte-black rounded-full flex items-center justify-center text-white">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                    </motion.div>
                </div>

                {/* Agents Management List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                    {loading ? (
                        <div className="col-span-2 py-20 flex justify-center">
                            <LucideLoader2 className="w-12 h-12 text-accent-gold animate-spin" />
                        </div>
                    ) : agents.map((agent, i) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[3rem] overflow-hidden border border-matte-black/5 shadow-xl hover:shadow-2xl transition-all duration-700"
                        >
                            <div className="p-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-20 h-20 bg-beige rounded-[2rem] flex items-center justify-center relative">
                                        <Bot className="w-10 h-10 text-matte-black" />
                                        <div className={`absolute -top-1 -right-1 w-6 h-6 border-4 border-white rounded-full ${agent.status === "active" ? "bg-emerald-500" : "bg-neutral-300"}`} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(agent)}
                                            className="p-3 bg-beige rounded-full hover:bg-matte-black hover:text-white transition-all"
                                            title="Agent Settings"
                                        >
                                            <Settings2 className="w-5 h-5" />
                                        </button>
                                        {agent.status === "active" ? (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Are you sure you want to terminate ${agent.name}'s subscription?`)) {
                                                        handleTerminate(agent.id);
                                                    }
                                                }}
                                                className="p-3 rounded-full transition-all bg-red-50 text-red-500 hover:bg-red-500 hover:text-white"
                                                title="Terminate Subscription"
                                            >
                                                <Pause className="w-5 h-5 fill-current" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedAgent(agent);
                                                    setShowHireModal(true);
                                                }}
                                                className="p-3 rounded-full transition-all bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                                title="Hire Agent"
                                            >
                                                <Play className="w-5 h-5 fill-current" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-3xl font-black tracking-tight text-matte-black mb-4">{agent.name}</h3>

                                <div className="grid grid-cols-2 gap-6 mb-10">
                                    <div>
                                        <p className="text-[10px] font-black text-matte-black/30 uppercase tracking-[0.2em] mb-2">Voice Avatar</p>
                                        <div className="flex items-center gap-2 font-bold text-sm text-matte-black">
                                            <Mic className="w-4 h-4 text-accent-gold" /> {agent.voiceConfig.voiceId}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-matte-black/30 uppercase tracking-[0.2em] mb-2">Total Outreach</p>
                                        <div className="flex items-center gap-2 font-bold text-sm text-matte-black">
                                            <MessageSquare className="w-4 h-4 text-accent-gold" /> {agent.calls || 0} Calls
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => openEditModal(agent)}
                                >
                                    Edit System Prompt
                                </Button>
                            </div>
                        </motion.div>
                    ))}

                    {/* Hire/Add New placeholder */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        onClick={() => {
                            setAgentData({ name: "", systemPrompt: "You are a helpful real estate assistant.", voiceId: "rachel" });
                            setShowCreateModal(true);
                        }}
                        className="border-4 border-dashed border-matte-black/5 rounded-[3.5rem] flex flex-col items-center justify-center p-12 group cursor-pointer"
                    >
                        <div className="w-20 h-20 bg-matte-black/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-accent-gold transition-colors duration-500">
                            <PlusIcon className="w-10 h-10 text-matte-black/20 group-hover:text-matte-black" />
                        </div>
                        <h3 className="text-2xl font-black text-matte-black/20 group-hover:text-matte-black tracking-tighter uppercase italic">Hire New AI Staff</h3>
                    </motion.div>

                    {/* Modal Overlay Logic */}
                    {(showCreateModal || showEditModal || showHireModal) && (
                        <div className="fixed inset-0 bg-matte-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
                            <AnimatePresence>
                                {/* Create Agent Modal */}
                                {showCreateModal && (
                                    <motion.div
                                        key="create-modal"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl my-auto"
                                    >
                                        <h2 className="text-3xl font-black tracking-tighter mb-6 italic">CREATE NEW AGENT.</h2>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">Agent Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Sarah"
                                                    value={agentData.name}
                                                    onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                                                    className="w-full bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">System Prompt</label>
                                                <textarea
                                                    rows={4}
                                                    placeholder="Instructions for the agent..."
                                                    value={agentData.systemPrompt}
                                                    onChange={(e) => setAgentData({ ...agentData, systemPrompt: e.target.value })}
                                                    className="w-full bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">Voice ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. rachel"
                                                    value={agentData.voiceId}
                                                    onChange={(e) => setAgentData({ ...agentData, voiceId: e.target.value })}
                                                    className="w-full bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setShowCreateModal(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                onClick={handleCreateAgent}
                                                disabled={submitting}
                                            >
                                                {submitting ? "Creating..." : "Create Agent"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Edit Agent Modal */}
                                {showEditModal && selectedAgent && (
                                    <motion.div
                                        key="edit-modal"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl my-auto"
                                    >
                                        <h2 className="text-3xl font-black tracking-tighter mb-6 italic">EDIT {selectedAgent.name.toUpperCase()}.</h2>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">Agent Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Sarah"
                                                    value={agentData.name}
                                                    onChange={(e) => setAgentData({ ...agentData, name: e.target.value })}
                                                    className="w-full bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">System Prompt</label>
                                                <textarea
                                                    rows={6}
                                                    placeholder="Instructions for the agent..."
                                                    value={agentData.systemPrompt}
                                                    onChange={(e) => setAgentData({ ...agentData, systemPrompt: e.target.value })}
                                                    className="w-full bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">Voice ID</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. rachel"
                                                    value={agentData.voiceId}
                                                    onChange={(e) => setAgentData({ ...agentData, voiceId: e.target.value })}
                                                    className="w-full bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setShowEditModal(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                onClick={handleUpdateAgent}
                                                disabled={submitting}
                                            >
                                                {submitting ? "Updating..." : "Save Changes"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Hire Agent Modal */}
                                {showHireModal && selectedAgent && (
                                    <motion.div
                                        key="hire-modal"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl my-auto"
                                    >
                                        <h2 className="text-3xl font-black tracking-tighter mb-6 italic">HIRE {selectedAgent.name.toUpperCase()}.</h2>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">Select Plan</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
                                                        <button
                                                            key={p}
                                                            onClick={() => setSelectedPlan(p)}
                                                            className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all ${selectedPlan === p ? 'bg-matte-black text-white' : 'bg-beige text-matte-black/60'}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black uppercase tracking-widest text-matte-black/40 mb-2 block">Card Number (Mock)</label>
                                                <input
                                                    type="text"
                                                    placeholder="xxxx-xxxx-xxxx-xxxx"
                                                    value={cardNumber}
                                                    onChange={(e) => setCardNumber(e.target.value)}
                                                    className="w-full bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none"
                                                />
                                                <p className="text-[8px] text-matte-black/30 mt-2 font-medium">Use any Luhn-valid card for this demo.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setShowHireModal(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1"
                                                onClick={() => handleHire(selectedAgent.id)}
                                                disabled={submitting}
                                            >
                                                {submitting ? "Processing..." : "Confirm"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const AiAgentsPage = () => {
    return (
        <ProtectedRoute requiredRole="seller">
            <main className="min-h-screen bg-beige">
                <Navbar />
                <AiAgentsContent />
                <Footer />
            </main>
        </ProtectedRoute>
    );
};

export default AiAgentsPage;
