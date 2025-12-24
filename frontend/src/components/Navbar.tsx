"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Search, Heart, User, LayoutGrid } from "lucide-react";

const Navbar = () => {
    const [currentUser, setCurrentUser] = React.useState<{ id?: string; name?: string; role?: string } | null>(null);

    React.useEffect(() => {
        if (typeof window === "undefined") return;

        const loadUser = () => {
            const stored = localStorage.getItem("user");
            if (!stored) {
                setCurrentUser(null);
                return;
            }
            try {
                const parsed = JSON.parse(stored);
                setCurrentUser(parsed);
            } catch {
                setCurrentUser(null);
            }
        };

        loadUser();

        const handleStorage = (event: StorageEvent) => {
            if (event.key === "user") loadUser();
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const handleSignOut = () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem("user");
        setCurrentUser(null);
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-full px-8 py-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-matte-black rounded-lg flex items-center justify-center group-hover:bg-accent-gold transition-colors duration-500">
                        <Home className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-matte-black group-hover:text-accent-gold transition-colors duration-500">
                        Grih Astha
                    </span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-matte-black/70">
                    <Link href="/properties" className="hover:text-matte-black transition-colors">PROPERTIES</Link>
                    <Link href="/about" className="hover:text-matte-black transition-colors">ABOUT</Link>
                    <Link href="/dashboard" className="hover:text-matte-black transition-colors">DASHBOARD</Link>
                    <Link href="/ai-agents" className="hover:text-matte-black transition-colors">AI AGENTS</Link>
                    <Link href="/contact" className="hover:text-matte-black transition-colors">CONTACT US</Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-beige-dark/50 rounded-full transition-colors">
                        <Search className="w-5 h-5 text-matte-black" />
                    </button>
                    <Link href="/cart" className="p-2 hover:bg-beige-dark/50 rounded-full transition-colors relative">
                        <Heart className="w-5 h-5 text-matte-black" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-accent-gold rounded-full" />
                    </Link>
                    <div className="h-6 w-[1px] bg-matte-black/10 mx-2" />
                    {currentUser ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-beige-dark/70 rounded-full border border-matte-black/5">
                                <div className="w-8 h-8 rounded-full bg-matte-black text-white flex items-center justify-center">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-xs font-bold text-matte-black/60">{currentUser.role || "Member"}</span>
                                    <span className="text-sm font-semibold text-matte-black">{currentUser.name || "Signed In"}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-5 py-2.5 bg-matte-black text-white rounded-full hover:bg-accent-gold transition-all duration-500 shadow-lg shadow-matte-black/10"
                            >
                                <span className="text-sm font-semibold">Sign Out</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href="/auth/login" className="flex items-center gap-2 px-5 py-2.5 bg-matte-black text-white rounded-full hover:bg-accent-gold transition-all duration-500 shadow-lg shadow-matte-black/10">
                                <User className="w-4 h-4" />
                                <span className="text-sm font-semibold">Sign In</span>
                            </Link>
                            <Link href="/auth/register" className="flex items-center gap-2 px-5 py-2.5 bg-beige text-matte-black rounded-full border border-matte-black/10 hover:bg-matte-black hover:text-white transition-all duration-500">
                                <span className="text-sm font-semibold">Sign Up</span>
                            </Link>
                        </div>
                    )}
                    <button className="md:hidden p-2 hover:bg-beige-dark/50 rounded-full transition-colors">
                        <LayoutGrid className="w-5 h-5 text-matte-black" />
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
