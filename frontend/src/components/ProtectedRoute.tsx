"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: "buyer" | "seller" | "agent";
    redirectTo?: string;
}

export default function ProtectedRoute({
    children,
    requiredRole,
    redirectTo = "/auth/login"
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(redirectTo);
        }

        // Check role if specified
        if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
            // Redirect to appropriate page based on role
            if (user?.role === "seller") {
                router.push("/dashboard");
            } else {
                router.push("/properties");
            }
        }
    }, [isAuthenticated, isLoading, router, redirectTo, requiredRole, user]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-matte-black">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-accent-gold mx-auto mb-4" />
                    <p className="text-white/60 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!isAuthenticated) {
        return null; // Will redirect via useEffect
    }

    // Role mismatch
    if (requiredRole && user?.role !== requiredRole) {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
