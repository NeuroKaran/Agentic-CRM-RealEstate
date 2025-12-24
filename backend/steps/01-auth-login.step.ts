import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { corsMiddleware } from '../middleware/cors';
import { generateToken } from '../services/jwt';

const loginSchema = z.object({
    email: z.string().min(1, "Identifier is required"),
    password: z.string().min(1, "Password is required"),
});

export const config: ApiRouteConfig = {
    name: 'LoginUser',
    type: 'api',
    path: '/api/auth/login',
    method: 'POST',
    middleware: [corsMiddleware],
    emits: ['user.logged_in'],
    flows: ['CRM'],
};

export const handler: Handlers['LoginUser'] = async (req, { emit, logger }) => {
    try {
        const body = { ...req.body };
        if (body.email) body.email = body.email.trim();
        
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { email: identifier, password } = parsed.data;

        // Find user by email or name (both case-insensitive)
        const user = await db.select().from(users).where(
            or(
                eq(users.email, identifier.toLowerCase()),
                sql`LOWER(${users.name}) = ${identifier.toLowerCase()}`
            )
        ).get();
        if (!user) {
            return {
                status: 401,
                body: { error: 'Invalid credentials' },
            };
        }

        // Verify password (simple check for now as per seed)
        if (user.password !== password) {
            return {
                status: 401,
                body: { error: 'Invalid credentials' },
            };
        }

        logger.info('User logged in', { userId: user.id });

        await (emit as any)({
            topic: 'user.logged_in',
            data: { userId: user.id, email: user.email },
        });

        const { password: _, ...safeUser } = user;
        const token = generateToken(user.id, user.email, user.role);

        return {
            status: 200,
            body: {
                message: 'Login successful',
                user: safeUser,
                token
            },
        };
    } catch (error) {
        logger.error('Login error', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
