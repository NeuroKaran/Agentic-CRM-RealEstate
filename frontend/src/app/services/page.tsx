"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Paintbrush, ShieldCheck, Headphones, Zap } from "lucide-react";

const ServicesPage = () => {
    const services = [
        { title: "Architectural Design", desc: "Bespoke spatial planning and aesthetic consulting for premium residences.", icon: <Paintbrush className="w-8 h-8" /> },
        { title: "Asset Management", desc: "Comprehensive oversight of your real estate portfolio with real-time reporting.", icon: <ShieldCheck className="w-8 h-8" /> },
        { title: "AI Concierge", desc: "24/7 automated sales and support staffing tailored to your brand voice.", icon: <Zap className="w-8 h-8" /> },
        { title: "Legal Consulting", desc: "Expert guidance on international luxury property transactions.", icon: <Headphones className="w-8 h-8" /> },
    ];

    return (
        <main className="min-h-screen bg-white text-matte-black">
            <Navbar />

            <section className="pt-60 pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-32"
                    >
                        <span className="text-accent-gold font-bold tracking-[0.4em] uppercase text-xs mb-8 block">Our Expertise</span>
                        <h1 className="text-7xl md:text-9xl font-black leading-none tracking-tighter mb-12 italic uppercase">BEYOND <br /> BROKERAGE.</h1>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-px bg-matte-black/5 rounded-[4rem] overflow-hidden border border-matte-black/5">
                        {services.map((service, i) => (
                            <motion.div
                                key={service.title}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-20 hover:bg-beige transition-colors duration-700"
                            >
                                <div className="text-accent-gold mb-8">{service.icon}</div>
                                <h3 className="text-3xl font-black tracking-tight mb-4 uppercase">{service.title}</h3>
                                <p className="text-lg text-matte-black/40 font-medium leading-relaxed">{service.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default ServicesPage;
