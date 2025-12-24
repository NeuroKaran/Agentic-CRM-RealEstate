"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShoppingBag, X, MoveRight, PhoneCall, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";

interface CartItem {
    id: string;
    propertyId: string;
    notes?: string;
    addedAt: string;
    property: {
        id: string;
        title: string;
        price: number;
        location: { city?: string; state?: string } | string;
        bedrooms?: number;
        bathrooms?: number;
        size: number;
        images?: string[];
        propertyType: string;
    } | null;
}

const CartPage = () => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        const fetchCart = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/cart?buyerId=${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setCartItems(data.items || []);
                }
            } catch (error) {
                console.error("Error fetching cart:", error);
                showToast("Failed to load cart items", "error");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchCart();
        }
    }, [user?.id, authLoading, showToast]);

    const handleDelete = async (cartItemId: string) => {
        setDeleting(cartItemId);
        try {
            const response = await fetch(`http://localhost:3000/api/cart/${cartItemId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
                showToast("Property removed from shortlist", "success");
            } else {
                showToast("Failed to remove item", "error");
            }
        } catch (error) {
            console.error("Error deleting cart item:", error);
            showToast("Failed to remove item", "error");
        } finally {
            setDeleting(null);
        }
    };

    const formatPrice = (price: number) => {
        if (price >= 10000000) {
            return `₹${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `₹${(price / 100000).toFixed(2)} L`;
        }
        return `₹${price.toLocaleString("en-IN")}`;
    };

    const getLocationString = (location: CartItem["property"] extends null ? never : NonNullable<CartItem["property"]>["location"]) => {
        if (typeof location === "string") {
            try {
                const parsed = JSON.parse(location);
                return `${parsed.city || ""}, ${parsed.state || ""}`.replace(/^, |, $/g, "");
            } catch {
                return location;
            }
        }
        return `${location?.city || ""}, ${location?.state || ""}`.replace(/^, |, $/g, "");
    };

    const getPropertyImage = (property: CartItem["property"]) => {
        if (!property?.images) return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
        const images = typeof property.images === "string" ? JSON.parse(property.images) : property.images;
        return images[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c";
    };

    if (authLoading || loading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <section className="pt-40 pb-32 px-6 flex justify-center">
                    <Loader2 className="w-12 h-12 text-accent-gold animate-spin" />
                </section>
                <Footer />
            </main>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <section className="pt-40 pb-32 px-6">
                    <div className="max-w-xl mx-auto text-center">
                        <ShoppingBag className="w-16 h-16 text-matte-black/20 mx-auto mb-6" />
                        <h1 className="text-3xl font-black tracking-tighter text-matte-black mb-4">Please Sign In</h1>
                        <p className="text-matte-black/60 mb-8">Sign in to view your shortlisted properties.</p>
                        <Link href="/auth/login">
                            <Button>Sign In</Button>
                        </Link>
                    </div>
                </section>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <section className="pt-40 pb-32 px-6">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 mb-12"
                    >
                        <div className="w-16 h-16 bg-beige rounded-3xl flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-matte-black" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-matte-black">YOUR SHORTLIST.</h1>
                            <p className="text-matte-black/40 font-bold uppercase tracking-widest text-xs">
                                {cartItems.length} {cartItems.length === 1 ? "Property" : "Properties"} Saved
                            </p>
                        </div>
                    </motion.div>

                    {/* Cart Items */}
                    {cartItems.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-20"
                        >
                            <ShoppingBag className="w-16 h-16 text-matte-black/20 mx-auto mb-6" />
                            <h2 className="text-2xl font-black tracking-tighter text-matte-black mb-4">Your shortlist is empty</h2>
                            <p className="text-matte-black/60 mb-8">Start exploring properties and add your favorites here.</p>
                            <Link href="/properties">
                                <Button>Browse Properties</Button>
                            </Link>
                        </motion.div>
                    ) : (
                        <>
                            <div className="space-y-6 mb-16">
                                {cartItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group flex flex-col md:flex-row gap-8 p-6 bg-beige/30 rounded-[2.5rem] border border-transparent hover:border-beige-dark transition-all duration-500"
                                    >
                                        <div className="w-full md:w-64 h-48 rounded-2xl overflow-hidden shadow-xl">
                                            <img
                                                src={getPropertyImage(item.property)}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                alt={item.property?.title || "Property"}
                                            />
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between py-2">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <Link href={`/properties/${item.propertyId}`}>
                                                        <h3 className="text-2xl font-black tracking-tight text-matte-black hover:text-accent-gold transition-colors cursor-pointer">
                                                            {item.property?.title || "Property"}
                                                        </h3>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={deleting === item.id}
                                                        className="p-2 hover:bg-red-50 text-matte-black/20 hover:text-red-500 rounded-full transition-all disabled:opacity-50"
                                                        aria-label="Remove from shortlist"
                                                    >
                                                        {deleting === item.id ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <X className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-accent-gold font-bold text-lg mb-2">
                                                    {item.property ? formatPrice(item.property.price) : "Price not available"}
                                                </p>
                                                {item.property?.location && (
                                                    <p className="text-matte-black/50 text-sm mb-4">
                                                        {getLocationString(item.property.location)}
                                                    </p>
                                                )}
                                                <div className="flex gap-4 text-xs font-bold text-matte-black/40 uppercase tracking-widest">
                                                    {item.property?.bedrooms && <span>{item.property.bedrooms} BEDS</span>}
                                                    {item.property?.bathrooms && <span>{item.property.bathrooms} BATHS</span>}
                                                    {item.property?.size && <span>{item.property.size.toLocaleString()} SQFT</span>}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 mt-6">
                                                <Link href={`/properties/${item.propertyId}`}>
                                                    <Button className="flex-1 md:flex-none">View Details</Button>
                                                </Link>
                                                <Button variant="outline" className="flex-1 md:flex-none gap-2">
                                                    <PhoneCall className="w-4 h-4" />
                                                    Call Agent
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Checkout/Summary style CTA */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-10 bg-matte-black text-white rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8"
                            >
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter mb-2">READY TO MOVE FORWARD?</h2>
                                    <p className="text-white/40 font-medium tracking-tight">Schedule personal tours for all your shortlisted items in one click.</p>
                                </div>
                                <Button size="lg" className="bg-white text-matte-black hover:bg-accent-gold group">
                                    Schedule All Tours
                                    <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </motion.div>
                        </>
                    )}
                </div>
            </section>

            <Footer />
        </main>
    );
};

export default CartPage;
