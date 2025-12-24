"use client";

import React from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

const ContactPage = () => {
    return (
        <main className="min-h-screen bg-beige">
            <Navbar />

            <section className="pt-40 pb-32 px-6">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <span className="text-accent-gold font-bold tracking-[0.4em] uppercase text-xs mb-8 block">
                            Contact Us
                        </span>
                        <h1 className="text-7xl md:text-8xl font-black text-matte-black leading-[0.85] tracking-tighter mb-12 italic">
                            LET&apos;S TALK <br /> PROPERTY.
                        </h1>

                        <div className="space-y-10 mb-12">
                            <div className="flex items-center gap-6 group">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center group-hover:bg-matte-black group-hover:text-white transition-all duration-500">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-matte-black/30 mb-1">Direct Email</p>
                                    <p className="text-xl font-bold text-matte-black">concierge@propertyhub.com</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center group-hover:bg-matte-black group-hover:text-white transition-all duration-500">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-matte-black/30 mb-1">Inquiry Line</p>
                                    <p className="text-xl font-bold text-matte-black">+1 (800) 555-0123</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center group-hover:bg-matte-black group-hover:text-white transition-all duration-500">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-matte-black/30 mb-1">Global Studio</p>
                                    <p className="text-xl font-bold text-matte-black">Beverly Hills, CA 90210</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Form Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-12 rounded-[4rem] shadow-2xl relative"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-gold rounded-full flex items-center justify-center text-matte-black font-black uppercase tracking-tighter text-center leading-none text-xs rotate-12">
                            Ready to <br /> consult?
                        </div>

                        <div className="space-y-6 mb-10">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest px-2 text-matte-black/40">First Name</p>
                                    <input type="text" className="w-full bg-beige/50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" placeholder="Alex" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest px-2 text-matte-black/40">Last Name</p>
                                    <input type="text" className="w-full bg-beige/50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" placeholder="Rivera" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest px-2 text-matte-black/40">Email Address</p>
                                <input type="email" className="w-full bg-beige/50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none" placeholder="alex@example.com" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest px-2 text-matte-black/40">Message</p>
                                <textarea rows={4} className="w-full bg-beige/50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none resize-none" placeholder="Tell us about your project..."></textarea>
                            </div>
                        </div>

                        <Button size="lg" className="w-full">
                            Send Message
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default ContactPage;
