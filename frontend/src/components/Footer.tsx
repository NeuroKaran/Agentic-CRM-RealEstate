"use client";

import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Home } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-white py-24 px-6 border-t border-matte-black/5">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-10 h-10 bg-matte-black rounded-lg flex items-center justify-center">
                                <Home className="text-white w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-matte-black">
                                Grih Astha
                            </span>
                        </div>
                        <p className="text-matte-black/40 font-medium leading-relaxed mb-8">
                            Elevating the luxury real estate experience through minimalist design and advanced technology.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="p-3 bg-beige rounded-full hover:bg-matte-black hover:text-white transition-all duration-500">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold tracking-[0.3em] uppercase mb-8 text-matte-black/30">Properties</h4>
                        <ul className="space-y-4 font-bold text-matte-black/60">
                            <li><a href="#" className="hover:text-accent-gold transition-colors">Residential</a></li>
                            <li><a href="#" className="hover:text-accent-gold transition-colors">Commercial</a></li>
                            <li><a href="#" className="hover:text-accent-gold transition-colors">Industrial</a></li>
                            <li><a href="#" className="hover:text-accent-gold transition-colors">Land Listings</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold tracking-[0.3em] uppercase mb-8 text-matte-black/30">Company</h4>
                        <ul className="space-y-4 font-bold text-matte-black/60">
                            <li><a href="#" className="hover:text-accent-gold transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-accent-gold transition-colors">Our Services</a></li>
                            <li><a href="#" className="hover:text-accent-gold transition-colors">Success Stories</a></li>
                            <li><a href="#" className="hover:text-accent-gold transition-colors">Contact</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold tracking-[0.3em] uppercase mb-8 text-matte-black/30">Newsletter</h4>
                        <p className="text-matte-black/40 font-medium mb-6">Receive curated property insights weekly.</p>
                        <div className="flex flex-col gap-3">
                            <input
                                type="email"
                                placeholder="email@example.com"
                                className="bg-beige border-none rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-matte-black/20 focus:outline-accent-gold"
                            />
                            <button className="bg-matte-black text-white rounded-2xl py-4 text-sm font-black uppercase tracking-widest hover:bg-accent-gold transition-all duration-500">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-matte-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs font-bold text-matte-black/20 uppercase tracking-[0.2em]">
                        © 2025 Grih Astha Global. All Rights Reserved.
                    </p>
                    <div className="flex gap-8 text-xs font-bold text-matte-black/20 uppercase tracking-[0.2em]">
                        <a href="#" className="hover:text-matte-black transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-matte-black transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
