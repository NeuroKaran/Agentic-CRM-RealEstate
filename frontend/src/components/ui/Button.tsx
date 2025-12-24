"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
}

const Button = ({
    variant = "primary",
    size = "md",
    className,
    children,
    ...props
}: ButtonProps) => {
    const variants = {
        primary: "bg-matte-black text-white hover:bg-accent-gold shadow-lg shadow-matte-black/10",
        secondary: "bg-beige-dark text-matte-black hover:bg-matte-black hover:text-white",
        outline: "border-2 border-matte-black text-matte-black hover:bg-matte-black hover:text-white",
        ghost: "bg-transparent text-matte-black hover:bg-beige-dark/30",
    };

    const sizes = {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-10 py-4 text-base",
    };

    return (
        <motion.button
            type={props.type || "button"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "rounded-full font-bold tracking-tight transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Button;
