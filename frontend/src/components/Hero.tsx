"use client";

import React from "react";
import { motion } from "framer-motion";
import Button from "./ui/Button";
import { MoveRight } from "lucide-react";
import Link from "next/link";

const Hero = () => {
    return (
        <section className="relative min-h-screen flex items-center pt-24 px-6 overflow-hidden">
            {/* Background Architectural Element (Inspiration from Image 0) */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-matte-black hidden lg:block">
                <motion.div
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="w-full h-full relative"
                >
                    {/* Mockup of a building texture using lines */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, #ffffff 21px)',
                            backgroundSize: '40px 100%'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-matte-black" />

                    {/* We'll use a placeholder image that feels architectural */}
                    <img
                        src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
                        alt="Modern Architecture"
                        className="w-full h-full object-cover grayscale mix-blend-overlay"
                    />
                </motion.div>
            </div>

            <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
                <div className="max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <span className="text-accent-gold font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                            Luxury Real Estate
                        </span>
                        <h1 className="text-6xl md:text-8xl font-black text-matte-black leading-[0.95] tracking-tighter mb-8 italic">
                            MINIMALIST <br />
                            <span className="text-transparent border-t-matte-black" style={{ WebkitTextStroke: '2px #121212' }}>ARCHITECTURAL</span> <br />
                            EXCELLENCE.
                        </h1>
                        <p className="text-lg text-matte-black/60 leading-relaxed mb-10 max-w-md font-medium">
                            Transforming spaces into elegant and functional minimalist designs. We bring vision to life with precision and premium aesthetics.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/properties">
                                <Button size="lg" className="group">
                                    Explore Properties
                                    <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link href="/about">
                                <Button variant="outline" size="lg">
                                    Our Services
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-16 flex items-center gap-12"
                    >
                        <div>
                            <p className="text-3xl font-black text-matte-black">2.4k+</p>
                            <p className="text-xs font-bold text-matte-black/40 uppercase tracking-widest">Properties Sold</p>
                        </div>
                        <div className="h-10 w-[1px] bg-matte-black/10" />
                        <div>
                            <p className="text-3xl font-black text-matte-black">150+</p>
                            <p className="text-xs font-bold text-matte-black/40 uppercase tracking-widest">Design Awards</p>
                        </div>
                    </motion.div>
                </div>

                {/* Small floating card (Inspiration from Image 2) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                    className="relative hidden lg:block"
                >
                    <div className="bg-white p-4 rounded-2xl shadow-2xl max-w-sm absolute -bottom-20 -left-20 glass">
                        <img
                            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop"
                            alt="Interior Design"
                            className="w-full h-48 object-cover rounded-xl mb-4"
                        />
                        <h3 className="text-xl font-bold text-matte-black mb-2 leading-none">Modern Sanctuary</h3>
                        <p className="text-sm text-matte-black/50 mb-4 tracking-tight">Villas starting from $1.2M</p>
                        <Button variant="secondary" size="sm" className="w-full">View Details</Button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
