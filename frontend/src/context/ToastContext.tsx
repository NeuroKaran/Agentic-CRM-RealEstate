"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto-dismiss
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_DURATION);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case "success":
                return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case "error":
                return <XCircle className="w-5 h-5 text-red-500" />;
            case "info":
                return <AlertCircle className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = (type: ToastType) => {
        switch (type) {
            case "success":
                return "bg-emerald-50 border-emerald-200";
            case "error":
                return "bg-red-50 border-red-200";
            case "info":
                return "bg-blue-50 border-blue-200";
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl backdrop-blur-sm ${getBgColor(toast.type)}`}
                        >
                            {getIcon(toast.type)}
                            <span className="text-sm font-bold text-matte-black">{toast.message}</span>
                            <button
                                onClick={() => dismissToast(toast.id)}
                                className="ml-2 p-1 hover:bg-black/5 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-matte-black/40" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export default ToastContext;
