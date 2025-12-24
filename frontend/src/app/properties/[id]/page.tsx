"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    Bed,
    Bath,
    Maximize2,
    MapPin,
    CheckCircle2,
    PhoneCall,
    Share2,
    Heart
} from "lucide-react";
import Button from "@/components/ui/Button";
import VoiceCallWidget from "@/components/VoiceCallWidget";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
    description: string;
    amenities: string[];
}

const PropertyDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [property, setProperty] = React.useState<Property | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isCalling, setIsCalling] = React.useState(false);

    // Get buyerId from auth context
    const buyerId = user?.id || "guest";

    React.useEffect(() => {
        const fetchProperty = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/properties/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setProperty(data);
                }
            } catch (error) {
                console.error("Error fetching property:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProperty();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full" />
        </div>
    );

    if (!property) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
            <h1 className="text-4xl font-black mb-4">Property Not Found</h1>
            <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
    );

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleAddToShortlist = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buyerId: user?.id || 'guest',
                    propertyId: id,
                })
            });

            if (response.ok) {
                alert("Added to shortlist and inquiry sent to seller!");
            } else {
                const data = await response.json();
                alert(data.error || "Failed to add to shortlist");
            }
        } catch (error) {
            alert("Error sending inquiry.");
        }
    };
    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Dynamic Image Gallery Segment */}
            <section className="pt-24 px-6 mb-12">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 h-[70vh]">
                    <div className="md:col-span-3 rounded-[3rem] overflow-hidden shadow-2xl relative group">
                        <img
                            src={property.images[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                            alt={property.title}
                        />
                        <div className="absolute top-8 right-8 flex gap-3">
                            <button className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-matte-black transition-all">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleAddToShortlist}
                                className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-matte-black transition-all"
                            >
                                <Heart className={`w-5 h-5`} />
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col gap-4">
                        {property.images.slice(1, 3).map((img, i) => (
                            <div key={i} className="flex-1 rounded-[2rem] overflow-hidden shadow-lg">
                                <img src={img} className="w-full h-full object-cover" alt={`${property.title} interior ${i}`} />
                            </div>
                        ))}
                        {property.images.length > 3 && (
                            <div className="flex-1 rounded-[2rem] overflow-hidden shadow-lg relative">
                                <img src={property.images[3]} className="w-full h-full object-cover" alt="More" />
                                <div className="absolute inset-0 bg-matte-black/40 flex items-center justify-center text-white font-black uppercase tracking-widest text-xs cursor-pointer">
                                    View All {property.images.length} Photos
                                </div>
                            </div>
                        )}
                        {property.images.length <= 3 && (
                            <div className="flex-1 bg-beige rounded-[2rem] flex items-center justify-center text-matte-black/20 font-black uppercase tracking-widest text-xs">
                                Luxury Aspect
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Content Info */}
            <section className="px-6 pb-32">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">
                    {/* Left Column: Details */}
                    <div className="flex-[2]">
                        <div className="mb-12">
                            <div className="flex items-center gap-2 text-accent-gold font-bold uppercase tracking-widest text-xs mb-4">
                                <MapPin className="w-4 h-4" /> {property.location.address}, {property.location.city}
                            </div>
                            <h1 className="text-6xl font-black text-matte-black tracking-tighter mb-4 italic leading-none">{property.title.toUpperCase()}.</h1>
                            <p className="text-4xl font-black text-accent-gold tracking-tight">{formatPrice(property.price)}</p>
                        </div>

                        <div className="flex gap-10 py-10 border-y border-matte-black/5 mb-12">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black text-matte-black/30 uppercase tracking-widest mb-1">Bedrooms</p>
                                <div className="flex items-center gap-2 font-black text-xl"><Bed className="w-5 h-5" /> {String(property.bedrooms).padStart(2, '0')}</div>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black text-matte-black/30 uppercase tracking-widest mb-1">Bathrooms</p>
                                <div className="flex items-center gap-2 font-black text-xl"><Bath className="w-5 h-5" /> {String(property.bathrooms).padStart(2, '0')}</div>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-black text-matte-black/30 uppercase tracking-widest mb-1">Total Space</p>
                                <div className="flex items-center gap-2 font-black text-xl"><Maximize2 className="w-5 h-5" /> {property.size.toLocaleString()} SQFT</div>
                            </div>
                        </div>

                        <div className="mb-12">
                            <h3 className="text-2xl font-black tracking-tight mb-6 uppercase italic">Description.</h3>
                            <p className="text-matte-black/60 leading-relaxed font-medium text-lg">
                                {property.description || "No description available for this luxury property."}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-2xl font-black tracking-tight mb-6 uppercase italic">Amenities.</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {property.amenities.map((amenity) => (
                                    <div key={amenity} className="flex items-center gap-3 font-bold text-sm text-matte-black/70">
                                        <CheckCircle2 className="w-5 h-5 text-accent-gold" />
                                        {amenity}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sticky Contact Form */}
                    <div className="flex-1">
                        <div className="sticky top-40 bg-beige rounded-[3rem] p-10 shadow-2xl">
                            <div className="text-center mb-8">
                                <h4 className="text-2xl font-black tracking-tighter mb-2">INQUIRE TODAY.</h4>
                                <p className="text-xs text-matte-black/40 font-bold uppercase tracking-widest">Responses within 2 minutes</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <input type="text" placeholder="Your Name" className="w-full bg-white/50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none" />
                                <input type="email" placeholder="Email Address" className="w-full bg-white/50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none" />
                                <textarea placeholder="Your Message" rows={4} className="w-full bg-white/50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-accent-gold/20 outline-none resize-none"></textarea>
                            </div>

                            <Button
                                size="lg"
                                className="w-full mb-4"
                                onClick={handleAddToShortlist}
                            >
                                Send Inquiry
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full gap-3"
                                onClick={() => setIsCalling(true)}
                            >
                                <PhoneCall className="w-5 h-5" />
                                Call AI Assistant
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <AnimatePresence>
                {isCalling && (
                    <VoiceCallWidget
                        agentId="aria-agent"
                        agentName="Aria"
                        buyerId={buyerId}
                        propertyId={typeof id === "string" ? id : Array.isArray(id) ? id[0] : ""}
                        onClose={() => setIsCalling(false)}
                    />
                )}
            </AnimatePresence>

            <Footer />
        </main>
    );
};

export default PropertyDetailPage;
