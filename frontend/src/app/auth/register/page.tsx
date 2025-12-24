"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Home, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

const RegisterPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "buyer" as "buyer" | "seller"
    });

    const handleRegister = async () => {
        setError("");
        setIsLoading(true);
        try {
            const res = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            if (typeof window !== "undefined" && data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            if (data.user?.role === "seller") {
                router.push("/ai-agents");
            } else {
                router.push("/properties");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Registration failed";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-matte-black p-6">
            <div className="max-w-md w-full">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[4rem] p-12 shadow-2xl overflow-hidden relative"
                >
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-beige rounded-full" />

                    <div className="relative z-10">
                        <Link href="/" className="inline-flex items-center gap-2 mb-12 group">
                            <div className="w-10 h-10 bg-matte-black rounded-lg flex items-center justify-center">
                                <Home className="text-white w-5 h-5" />
                            </div>
                            <span className="font-bold text-matte-black tracking-tight text-xl italic">Grih Astha</span>
                        </Link>

                        <h1 className="text-4xl font-black text-matte-black tracking-tighter mb-4 leading-none">JOIN US.</h1>
                        <p className="text-matte-black/40 text-xs font-bold uppercase tracking-widest mb-10">Choose your role to begin</p>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4 mb-8">
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-beige/50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-beige/50 border-none rounded-2xl px-6 py-4 text-sm font-bold outline-none"
                            />
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-beige/50 border-none rounded-2xl px-6 py-4 pr-12 text-sm font-bold outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-matte-black/40 hover:text-matte-black transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, role: "buyer" })}
                                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === "buyer" ? "bg-matte-black text-white" : "bg-beige hover:bg-matte-black hover:text-white"}`}
                                >
                                    Buyer
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, role: "seller" })}
                                    className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === "seller" ? "bg-matte-black text-white" : "bg-beige hover:bg-matte-black hover:text-white"}`}
                                >
                                    Seller
                                </button>
                            </div>
                        </div>

                        <Button size="lg" className="w-full mb-6 group" onClick={handleRegister} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>

                        <div className="text-center">
                            <p className="text-xs font-bold text-matte-black/30 tracking-widest uppercase">
                                Already have an account? <Link href="/auth/login" className="text-accent-gold hover:underline">Sign In</Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
};

export default RegisterPage;
