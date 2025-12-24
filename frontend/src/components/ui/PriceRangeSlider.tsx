"use client";

import React, { useState, useEffect, useRef } from "react";

interface PriceRangeSliderProps {
    min?: number;
    max?: number;
    step?: number;
    value?: [number, number];
    onChange?: (value: [number, number]) => void;
    formatLabel?: (value: number) => string;
}

const formatINR = (value: number): string => {
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(1)}Cr`;
    } else if (value >= 100000) {
        return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString("en-IN")}`;
};

const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
    min = 0,
    max = 100000000,
    step = 500000,
    value,
    onChange,
    formatLabel = formatINR,
}) => {
    const [localValue, setLocalValue] = useState<[number, number]>(value || [min, max]);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            setLocalValue(value);
        }
    }, [value]);

    const getPercent = (val: number) => ((val - min) / (max - min)) * 100;

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMin = Math.min(Number(e.target.value), localValue[1] - step);
        const newValue: [number, number] = [newMin, localValue[1]];
        setLocalValue(newValue);
        onChange?.(newValue);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMax = Math.max(Number(e.target.value), localValue[0] + step);
        const newValue: [number, number] = [localValue[0], newMax];
        setLocalValue(newValue);
        onChange?.(newValue);
    };

    const minPercent = getPercent(localValue[0]);
    const maxPercent = getPercent(localValue[1]);

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-matte-black/40 uppercase tracking-widest">
                    Price Range
                </span>
                <span className="text-sm font-bold text-matte-black">
                    {formatLabel(localValue[0])} - {formatLabel(localValue[1])}
                </span>
            </div>

            <div className="relative h-2 w-full" ref={trackRef}>
                {/* Track background */}
                <div className="absolute h-2 w-full bg-beige rounded-full" />

                {/* Active track */}
                <div
                    className="absolute h-2 bg-accent-gold rounded-full"
                    style={{
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`,
                    }}
                />

                {/* Min thumb */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue[0]}
                    onChange={handleMinChange}
                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-20
                        [&::-webkit-slider-thumb]:pointer-events-auto
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:bg-matte-black
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:border-4
                        [&::-webkit-slider-thumb]:border-white
                        [&::-moz-range-thumb]:pointer-events-auto
                        [&::-moz-range-thumb]:w-5
                        [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:bg-matte-black
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:border-4
                        [&::-moz-range-thumb]:border-white"
                />

                {/* Max thumb */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue[1]}
                    onChange={handleMaxChange}
                    className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none z-20
                        [&::-webkit-slider-thumb]:pointer-events-auto
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:bg-accent-gold
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:border-4
                        [&::-webkit-slider-thumb]:border-white
                        [&::-moz-range-thumb]:pointer-events-auto
                        [&::-moz-range-thumb]:w-5
                        [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:bg-accent-gold
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:border-4
                        [&::-moz-range-thumb]:border-white"
                />
            </div>

            {/* Min/Max labels */}
            <div className="flex justify-between mt-2 text-[10px] font-bold text-matte-black/30 uppercase tracking-wider">
                <span>{formatLabel(min)}</span>
                <span>{formatLabel(max)}</span>
            </div>
        </div>
    );
};

export default PriceRangeSlider;
