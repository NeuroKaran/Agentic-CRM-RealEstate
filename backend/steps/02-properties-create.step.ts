import { ApiRouteConfig, Handlers } from 'motia';
import { z } from 'zod';
import { db } from '../db';
import { properties } from '../db/schema';

// Validation schema for property listing
const propertySchema = z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    propertyType: z.enum(['house', 'apartment', 'land', 'commercial']),
    price: z.number().positive(),
    location: z.object({
        address: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        lat: z.number().optional(),
        lng: z.number().optional(),
    }),
    size: z.number().positive(), // in sq ft
    bedrooms: z.number().int().min(0).optional(),
    bathrooms: z.number().int().min(0).optional(),
    amenities: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(), // URLs
    sellerId: z.string(),
});

// Create Property (POST)
export const config: ApiRouteConfig = {
    name: 'CreateProperty',
    type: 'api',
    path: '/api/properties',
    method: 'POST',
    emits: ['property.created'],
    flows: ['CRM'],
};

export const handler: Handlers['CreateProperty'] = async (req, { emit, logger }) => {
    try {
        const parsed = propertySchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const data = parsed.data;
        const propertyId = `prop_${Date.now()}`;

        const newProperty = {
            id: propertyId,
            title: data.title,
            description: data.description,
            propertyType: data.propertyType,
            price: data.price,
            location: JSON.stringify(data.location),
            size: data.size,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            amenities: JSON.stringify(data.amenities || []),
            images: JSON.stringify(data.images || []),
            sellerId: data.sellerId,
            status: 'pending',
            views: 0,
            inquiries: 0,
            // createdAt handled by default
        };

        // Store property
        await db.insert(properties).values(newProperty).run();

        logger.info('Property created', { propertyId, sellerId: data.sellerId });

        // Emit property created event
        await (emit as (args: { topic: string; data: unknown }) => Promise<void>)({
            topic: 'property.created',
            data: { propertyId, sellerId: data.sellerId },
        });

        return {
            status: 201,
            body: {
                message: 'Property listed successfully',
                property: { ...newProperty, location: data.location, amenities: data.amenities, images: data.images }
            },
        };
    } catch (error) {
        logger.error('Error creating property', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
