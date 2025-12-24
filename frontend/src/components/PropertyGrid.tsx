"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bed, Bath, MoveUpRight, MapPin, Loader2 } from "lucide-react";
import Button from "./ui/Button";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

interface Property {
    id: string;
    title: string;
    price: number;
    location: {
        address?: string;
        city: string;
        state?: string;
    };
    bedrooms: number;
    bathrooms: number;
    size: number;
    images: string[];
}

interface PropertyGridProps {
    searchQuery?: string;
    propertyType?: string;
    priceRange?: string; // min-max
    bedrooms?: string;
}

const PropertyGrid: React.FC<PropertyGridProps> = ({ searchQuery, propertyType, priceRange, bedrooms }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (searchQuery) params.append('city', searchQuery); // Using city for basic search
                if (propertyType) params.append('propertyType', propertyType);
                if (bedrooms) params.append('bedrooms', bedrooms);

                // Parse price range if provided (e.g. "1000000-2000000")
                if (priceRange) {
                    const [min, max] = priceRange.split('-');
                    if (min) params.append('minPrice', min);
                    if (max) params.append('maxPrice', max);
                }

                const response = await fetch(`http://localhost:3000/api/properties?${params.toString()}`);
                if (!response.ok) throw new Error("Failed to fetch properties");
                const data = await response.json();
                setProperties(data.properties);
            } catch (err) {
                console.error("Error fetching properties:", err);
                setError("Could not load properties. Please ensure the backend is running.");
                // Fallback to static properties for demo if API fails
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [searchQuery, propertyType, priceRange, bedrooms]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleAddToShortlist = async (e: React.MouseEvent, propertyId: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyerId: user?.id || 'guest',
                    propertyId: propertyId,
                })
            });

            if (response.ok) {
                showToast("Added to shortlist!", "success");
            } else {
                const data = await response.json();
                showToast(data.error || "Failed to add to shortlist", "error");
            }
        } catch (error) {
            showToast("Error sending inquiry.", "error");
        }
    };

    if (loading) {
        return (
            <div className="py-24 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-accent-gold animate-spin" />
            </div>
        );
    }

    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <motion.span
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-accent-gold font-bold tracking-[0.2em] uppercase text-xs mb-4 block"
                        >
                            Exclusive Listings
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl font-black text-matte-black tracking-tighter"
                        >
                            CURATED <br /> PROPERTIES.
                        </motion.h2>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Button variant="outline">View All Properties</Button>
                    </motion.div>
                </div>

                {error && (
                    <div className="mb-12 p-4 bg-beige-dark/20 text-matte-black/60 rounded-2xl text-center font-bold">
                        {error} (Using local demo data)
                    </div>
                )}

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {(properties.length > 0 ? properties : []).map((property, index) => (
                        <Link key={property.id} href={`/properties/${property.id}`}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <div className="relative overflow-hidden rounded-3xl mb-6 aspect-[4/5]">
                                    <img
                                        src={property.images?.[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"}
                                        alt={property.title}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                        <button
                                            onClick={(e) => handleAddToShortlist(e, property.id)}
                                            className="bg-white/20 backdrop-blur-md p-3 rounded-full hover:bg-white hover:text-matte-black transition-all"
                                            aria-label="Add to shortlist"
                                        >
                                            <Heart className="w-5 h-5 text-white" />
                                        </button>
                                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full">
                                            <MoveUpRight className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
                                        <p className="text-white font-black text-xl tracking-tight mb-1">{formatPrice(property.price)}</p>
                                        <div className="flex items-center gap-1 text-white/70 text-xs font-bold uppercase tracking-wider">
                                            <MapPin className="w-3 h-3" />
                                            {property.location.city}, {property.location.state || "USA"}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-2">
                                    <h3 className="text-xl font-bold text-matte-black mb-4 group-hover:text-accent-gold transition-colors duration-500">
                                        {property.title}
                                    </h3>
                                    <div className="flex items-center gap-6 text-sm text-matte-black/40 font-bold uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <Bed className="w-4 h-4" />
                                            {property.bedrooms} Bed
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Bath className="w-4 h-4" />
                                            {property.bathrooms} Bath
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {property.size} SQFT
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PropertyGrid;
