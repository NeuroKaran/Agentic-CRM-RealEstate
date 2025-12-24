import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { db } from '../db';
import { properties } from '../db/schema';
import { eq } from 'drizzle-orm';

// 1. Get Property (GET)
export const config: ApiRouteConfig = {
    name: 'GetProperty',
    type: 'api',
    path: '/api/properties/:id',
    method: 'GET',
    middleware: [corsMiddleware],
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['GetProperty'] = async (req, { logger }) => {
    try {
        const id = req.pathParams?.id as string;

        if (!id) {
            return {
                status: 400,
                body: { error: 'Property ID is required' },
            };
        }

        const property = await db.select().from(properties).where(eq(properties.id, id)).get();

        if (!property) {
            return {
                status: 404,
                body: { error: 'Property not found' },
            };
        }

        // Parse JSON fields back to objects for response
        const formattedProperty = {
            ...property,
            location: property.location,
            amenities: property.amenities || [],
            images: property.images || [],
        };

        return {
            status: 200,
            body: formattedProperty,
        };
    } catch (error) {
        logger.error('Error fetching property', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
