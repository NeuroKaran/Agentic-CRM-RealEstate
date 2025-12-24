"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, PenTool, Layout, PhoneCall, ArrowRight } from "lucide-react";
import Button from "./ui/Button";

const SERVICES = [
    {
        icon: <Shield className="w-10 h-10" />,
        title: "Premium Management",
        desc: "End-to-end property management with high-tier security and privacy for exclusive owners.",
    },
    {
        icon: <PenTool className="w-10 h-10" />,
        title: "Interior Design",
        desc: "Bespoke minimalist interior design services that prioritize functionality and aesthetic purity.",
    },
    {
        icon: <Layout className="w-10 h-10" />,
        title: "Real Estate Strategy",
        desc: "Investment consulting and market analysis for high-net-worth individuals and organizations.",
    },
    {
        icon: <PhoneCall className="w-10 h-10" />,
        title: "Voice AI Integration",
        desc: "Advanced AI-powered lead management and voice call automation for seamless CRM operations.",
    },
];

const Services = () => {
    return (
        <section className="py-32 px-6 bg-matte-black text-white relative overflow-hidden">
            {/* Decorative Arch (Inspiration from Image 3) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-white/[0.02] rounded-full border border-white/[0.05]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-accent-gold font-bold tracking-[0.4em] uppercase text-xs mb-6 block"
                    >
                        Our Expertise
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-7xl font-black tracking-tighter mb-8"
                    >
                        ELEVATING THE <br /> STANDARD.
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-white/40 max-w-2xl mx-auto text-lg leading-relaxed"
                    >
                        We provide a comprehensive suite of services designed to simplify property management and maximize investment potential through design and technology.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {SERVICES.map((service, index) => (
                        <motion.div
                            key={service.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="mb-8 text-accent-gold bg-white/5 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:bg-accent-gold group-hover:text-matte-black transition-all duration-700 ease-in-out">
                                {service.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-4 tracking-tight">{service.title}</h3>
                            <p className="text-white/50 text-base leading-relaxed mb-6 font-medium">
                                {service.desc}
                            </p>
                            <button className="flex items-center gap-2 text-accent-gold font-bold text-sm tracking-widest uppercase hover:gap-4 transition-all duration-500">
                                Learn More <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="mt-32 p-12 bg-beige text-matte-black rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-12"
                >
                    <div className="max-w-xl text-center md:text-left">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 italic">READY TO TRANSFORM YOUR ASPECT?</h2>
                        <p className="text-matte-black/60 font-medium tracking-tight">Connect with our senior consultants today and experience the future of luxury real estate management.</p>
                    </div>
                    <Button size="lg" className="whitespace-nowrap shadow-2xl">Get Started Now</Button>
                </motion.div>
            </div>
        </section>
    );
};

export default Services;
