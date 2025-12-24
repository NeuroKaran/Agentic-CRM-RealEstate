"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MoveRight, PlayCircle } from "lucide-react";
import Button from "@/components/ui/Button";

const AboutPage = () => {
    return (
        <main className="min-h-screen bg-beige text-matte-black">
            <Navbar />

            {/* Brand Story Hero */}
            <section className="pt-60 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <span className="text-accent-gold font-bold tracking-[0.4em] uppercase text-xs mb-8 block">
                                Since 2012
                            </span>
                            <h1 className="text-7xl md:text-9xl font-black text-matte-black leading-[0.85] tracking-tighter mb-12 italic">
                                A LEGACY OF <br /> MINIMALISM.
                            </h1>
                            <p className="text-xl text-matte-black/60 leading-relaxed font-medium max-w-lg mb-12">
                                We believe that architecture is not just about building structures, but about sculpting light, space, and experience. Grih Astha represents the intersection of digital efficiency and timeless aesthetic.
                            </p>
                            <div className="flex gap-4">
                                <Button size="lg" className="bg-matte-black text-white hover:bg-accent-gold group px-12">
                                    Our Portfolio
                                    <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <button className="flex items-center gap-3 text-sm font-bold text-matte-black tracking-widest uppercase hover:text-accent-gold transition-colors">
                                    <PlayCircle className="w-8 h-8" />
                                    Watch Story
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 1.1, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1.5 }}
                        className="flex-1 relative"
                    >
                        <div className="absolute inset-0 bg-accent-gold/20 blur-[120px] rounded-full" />
                        <img
                            src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
                            className="relative z-10 w-full aspect-square object-cover rounded-[5rem] grayscale hover:grayscale-0 transition-all duration-1000"
                            alt="Studio Architecture"
                        />
                    </motion.div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-32 px-6 bg-matte-black text-white rounded-[5rem]">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-3 gap-20">
                        <div>
                            <h2 className="text-5xl font-black tracking-tighter mb-8 leading-none">PURE <br /> VISION.</h2>
                            <p className="text-white/60 font-medium">Removing the unnecessary to reveal the essential. Every listing on our platform undergoes a rigorous aesthetic review.</p>
                        </div>
                        <div className="lg:border-x border-white/5 px-20 lg:px-20 -mx-10 md:mx-0">
                            <h2 className="text-5xl font-black tracking-tighter mb-8 leading-none">TECH <br /> EDGE.</h2>
                            <p className="text-white/60 font-medium">From AI sales agents to real-time voice CRM, we leverage the future to serve your legacy today.</p>
                        </div>
                        <div>
                            <h2 className="text-5xl font-black tracking-tighter mb-8 leading-none">GLOBAL <br /> ASPECT.</h2>
                            <p className="text-white/60 font-medium">A borderless approach to luxury properties. We represent the most exclusive aspects of living worldwide.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default AboutPage;
