"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    BarChart3,
    Users,
    Home,
    TrendingUp,
    ArrowUpRight,
    Plus,
    Bot,
    Loader2
} from "lucide-react";
import Button from "@/components/ui/Button";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type AnalyticsOverview = {
    totalViews: number;
    totalInquiries: number;
    totalProperties: number;
    conversionRate: string;
};

type AgentStat = {
    id: string;
    agentName: string;
    leadsAssigned: number;
};

type Analytics = {
    overview: AnalyticsOverview;
    agents?: AgentStat[];
};

type Lead = {
    id: string;
    name?: string;
    propertyId?: string;
    createdAt: string;
    status: string;
};

const DashboardContent = () => {
    const { user } = useAuth();
    const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
    const [leads, setLeads] = React.useState<Lead[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchData = React.useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            const [analyticsRes, leadsRes] = await Promise.all([
                fetch(`http://localhost:3000/api/analytics?sellerId=${user.id}`),
                fetch(`http://localhost:3000/api/leads?sellerId=${user.id}`)
            ]);

            if (analyticsRes.ok) {
                const data: Analytics = await analyticsRes.json();
                setAnalytics(data);
            }
            if (leadsRes.ok) {
                const data: { leads: Lead[] } = await leadsRes.json();
                setLeads(data.leads || []);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = analytics ? [
        { label: "Total Views", value: analytics.overview.totalViews.toLocaleString(), trend: "+12%", icon: <TrendingUp className="w-5 h-5" /> },
        { label: "Active Leads", value: analytics.overview.totalInquiries.toLocaleString(), trend: "+5%", icon: <Users className="w-5 h-5" /> },
        { label: "Properties", value: analytics.overview.totalProperties.toLocaleString(), trend: "0%", icon: <Home className="w-5 h-5" /> },
        { label: "Conversion", value: analytics.overview.conversionRate, trend: "+2%", icon: <BarChart3 className="w-5 h-5" /> },
    ] : [
        { label: "Total Views", value: "0", trend: "0%", icon: <TrendingUp className="w-5 h-5" /> },
        { label: "Active Leads", value: "0", trend: "0%", icon: <Users className="w-5 h-5" /> },
        { label: "Properties", value: "0", trend: "0%", icon: <Home className="w-5 h-5" /> },
        { label: "Conversion", value: "0%", trend: "0%", icon: <BarChart3 className="w-5 h-5" /> },
    ];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-gold" />
            </div>
        );
    }

    return (
        <section className="pt-40 pb-32 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-matte-black">CRM DASHBOARD.</h1>
                        <p className="text-matte-black/40 font-bold uppercase tracking-widest text-xs">Welcome back, {user?.name || "Seller"}</p>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/ai-agents">
                            <Button variant="outline" className="gap-2">
                                <Bot className="w-4 h-4" />
                                Manage AI Agents
                            </Button>
                        </Link>
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            Add New Property
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[2.5rem] border border-matte-black/5 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-beige rounded-2xl flex items-center justify-center text-matte-black">
                                    {stat.icon}
                                </div>
                                <span className="text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                                    {stat.trend} <ArrowUpRight className="w-3 h-3" />
                                </span>
                            </div>
                            <p className="text-matte-black/40 font-bold uppercase tracking-widest text-[10px] mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-matte-black tracking-tight">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Recent Leads */}
                    <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-matte-black/5 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black tracking-tight text-matte-black">RECENT INQUIRIES.</h3>
                            <button className="text-accent-gold font-bold text-xs uppercase tracking-widest hover:underline">View All</button>
                        </div>

                        <div className="space-y-6">
                            {leads.length === 0 ? (
                                <div className="py-20 text-center text-matte-black/20 font-black uppercase italic tracking-widest">No recent inquiries</div>
                            ) : leads.slice(0, 5).map((lead) => (
                                <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-beige/20 rounded-2xl transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-matte-black rounded-full flex items-center justify-center text-white font-bold">
                                            {lead.name ? lead.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : "L"}
                                        </div>
                                        <div>
                                            <p className="font-bold text-matte-black">{lead.name || "Anonymous Lead"}</p>
                                            <p className="text-xs text-matte-black/40 font-medium">Inquired about: {lead.propertyId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-matte-black">{new Date(lead.createdAt).toLocaleDateString()}</p>
                                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md ${lead.status === 'new' ? 'bg-accent-gold/10 text-accent-gold' : 'bg-matte-black/10 text-matte-black'}`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions / Agent Status */}
                    <div className="bg-matte-black text-white rounded-[3rem] p-10 shadow-2xl">
                        <h3 className="text-2xl font-black tracking-tight mb-8">AI ASSISTANTS.</h3>
                        <div className="space-y-6 mb-10">
                            {analytics?.agents?.map((agent) => (
                                <div key={agent.id} className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-10 h-10 bg-accent-gold rounded-xl flex items-center justify-center text-matte-black">
                                            <Bot className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold">{agent.agentName}</p>
                                            <p className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">Active • {agent.leadsAssigned} Leads</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-accent-gold h-full w-[100%]" />
                                    </div>
                                </div>
                            ))}
                            {(!analytics?.agents || analytics.agents.length === 0) && (
                                <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest text-center py-10">No active agents</p>
                            )}
                        </div>
                        <Link href="/ai-agents">
                            <Button className="w-full bg-white text-matte-black hover:bg-accent-gold">
                                Hire More Agents
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

const DashboardPage = () => {
    return (
        <ProtectedRoute requiredRole="seller">
            <main className="min-h-screen bg-[#FAFAFA]">
                <Navbar />
                <DashboardContent />
                <Footer />
            </main>
        </ProtectedRoute>
    );
};

export default DashboardPage;
