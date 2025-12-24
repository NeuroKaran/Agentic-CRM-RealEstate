import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { corsMiddleware } from '../middleware/cors';
import { generateToken } from '../services/jwt';

// Validation schema for registration
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['buyer', 'seller', 'agent']),
    phone: z.string().optional(),
    organization: z.string().optional(), // For sellers/agents
});

// 1. Register User
export const config: ApiRouteConfig = {
    name: 'RegisterUser',
    type: 'api',
    path: '/api/auth/register',
    method: 'POST',
    middleware: [corsMiddleware],
    emits: ['user.registered'],
    flows: ['CRM'], // Changed from 'auth' to match user edit
};

export const handler: Handlers['RegisterUser'] = async (req, { emit, logger }) => {
    try {
        const body = { ...req.body };
        if (body.email) body.email = body.email.toLowerCase().trim();
        
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { email, password, name, role, phone, organization } = parsed.data;

        // Check if user already exists
        const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
        if (existingUser) {
            return {
                status: 409,
                body: { error: 'User already exists with this email' },
            };
        }

        const userId = `user_${Date.now()}`;
        const newUser = {
            id: userId,
            email,
            password, // In production, hash this!
            name,
            role,
            phone,
            organization,
            createdAt: new Date(),
        };

        // Store user
        await db.insert(users).values(newUser).run();

        logger.info('User registered', { userId, email, role });

        // Emit user registered event
        await (emit as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'user.registered',
            data: { userId, email, role },
        });

        // Don't return password
        const { password: _, ...safeUser } = newUser;
        const token = generateToken(userId, email, role);

        return {
            status: 201,
            body: {
                message: 'User registered successfully',
                user: safeUser,
                token
            },
        };
    } catch (error) {
        logger.error('Registration error', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
