"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyGrid from "@/components/PropertyGrid";
import PriceRangeSlider from "@/components/ui/PriceRangeSlider";
import { Search, ChevronDown } from "lucide-react";

const PropertiesPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [bedrooms, setBedrooms] = useState("");
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]);
    const [showPriceFilter, setShowPriceFilter] = useState(false);

    // Convert price range to string format for PropertyGrid
    const priceRangeString = priceRange[0] > 0 || priceRange[1] < 100000000
        ? `${priceRange[0]}-${priceRange[1]}`
        : undefined;

    const formatPriceLabel = (value: number) => {
        if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(1)}Cr`;
        } else if (value >= 100000) {
            return `₹${(value / 100000).toFixed(1)}L`;
        }
        return `₹${value.toLocaleString("en-IN")}`;
    };

    return (
        <main className="min-h-screen bg-beige">
            <Navbar />

            {/* Header Section */}
            <section className="pt-40 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="text-accent-gold font-bold tracking-[0.3em] uppercase text-xs mb-4 block text-center">
                            Browse Listings
                        </span>
                        <h1 className="text-6xl md:text-8xl font-black text-matte-black leading-none tracking-tighter mb-12 text-center italic">
                            FIND YOUR <br /> ASPECT.
                        </h1>
                    </motion.div>

                    {/* Search & Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="glass rounded-[2.5rem] p-4 flex flex-col lg:flex-row items-center gap-4 shadow-2xl shadow-matte-black/5"
                    >
                        <div className="flex-1 w-full relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-matte-black/30 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by city..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/50 border-none rounded-full py-5 pl-14 pr-6 text-sm font-bold placeholder:text-matte-black/20 focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="relative group">
                                <button className="flex items-center gap-2 px-6 py-5 bg-white/50 rounded-full text-xs font-black tracking-widest uppercase hover:bg-white transition-colors">
                                    {propertyType || "Property Type"} <ChevronDown className="w-4 h-4 text-accent-gold" />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl p-2 hidden group-hover:block z-50">
                                    {['House', 'Villa', 'Mansion', 'Apartment'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setPropertyType(type)}
                                            className="w-full text-left px-4 py-2 hover:bg-beige rounded-xl text-xs font-bold"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setPropertyType("")}
                                        className="w-full text-left px-4 py-2 hover:bg-beige rounded-xl text-xs font-bold text-red-500"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <button className="flex items-center gap-2 px-6 py-5 bg-white/50 rounded-full text-xs font-black tracking-widest uppercase hover:bg-white transition-colors">
                                    {bedrooms ? `${bedrooms} Beds` : "Bedrooms"} <ChevronDown className="w-4 h-4 text-accent-gold" />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-32 bg-white rounded-2xl shadow-xl p-2 hidden group-hover:block z-50">
                                    {[3, 4, 5, 6].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setBedrooms(num.toString())}
                                            className="w-full text-left px-4 py-2 hover:bg-beige rounded-xl text-xs font-bold"
                                        >
                                            {num}+ Beds
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setBedrooms("")}
                                        className="w-full text-left px-4 py-2 hover:bg-beige rounded-xl text-xs font-bold text-red-500"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            {/* Price Range Filter */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowPriceFilter(!showPriceFilter)}
                                    className={`flex items-center gap-2 px-6 py-5 rounded-full text-xs font-black tracking-widest uppercase transition-colors ${priceRangeString ? 'bg-accent-gold text-matte-black' : 'bg-white/50 hover:bg-white'
                                        }`}
                                >
                                    {priceRangeString
                                        ? `${formatPriceLabel(priceRange[0])} - ${formatPriceLabel(priceRange[1])}`
                                        : "Price Range"
                                    }
                                    <ChevronDown className={`w-4 h-4 ${priceRangeString ? 'text-matte-black' : 'text-accent-gold'}`} />
                                </button>

                                {showPriceFilter && (
                                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl p-6 z-50">
                                        <PriceRangeSlider
                                            min={0}
                                            max={100000000}
                                            step={500000}
                                            value={priceRange}
                                            onChange={setPriceRange}
                                        />
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => {
                                                    setPriceRange([0, 100000000]);
                                                    setShowPriceFilter(false);
                                                }}
                                                className="flex-1 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl"
                                            >
                                                Reset
                                            </button>
                                            <button
                                                onClick={() => setShowPriceFilter(false)}
                                                className="flex-1 px-4 py-2 bg-matte-black text-white text-xs font-bold rounded-xl"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="p-5 bg-matte-black text-white rounded-full hover:bg-accent-gold transition-all duration-500">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Results Section */}
            <section className="bg-white rounded-t-[5rem]">
                <PropertyGrid
                    searchQuery={searchQuery}
                    propertyType={propertyType}
                    bedrooms={bedrooms}
                    priceRange={priceRangeString}
                />
            </section>

            <Footer />
        </main>
    );
};

export default PropertiesPage;
