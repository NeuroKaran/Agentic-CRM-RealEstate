import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { db } from '../db';
import { properties } from '../db/schema';
import { eq, gte, lte, and, like } from 'drizzle-orm';

// 1. List Properties (GET)
export const config: ApiRouteConfig = {
    name: 'ListProperties',
    type: 'api',
    path: '/api/properties',
    method: 'GET',
    middleware: [corsMiddleware],
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['ListProperties'] = async (req, { logger }) => {
    try {
        const { minPrice, maxPrice, propertyType, city, bedrooms } = req.queryParams;

        let query = db.select().from(properties);
        const conditions = [];

        if (minPrice) conditions.push(gte(properties.price, Number(minPrice)));
        if (maxPrice) conditions.push(lte(properties.price, Number(maxPrice)));
        if (propertyType) conditions.push(eq(properties.propertyType, propertyType as string));
        if (bedrooms) conditions.push(eq(properties.bedrooms, Number(bedrooms)));
        // For city, we need to parse the JSON location field, but standard SQL 'like' might not work easily on JSON in sqlite depending on version.
        // For MVP, if filter by city is strict, we might need a workaround or just fetch all and filter in JS if the dataset is small.
        // However, better-sqlite3 json support is good. Let's try to filter in JS for now for the JSON field or use a raw query if needed.
        // Let's stick to in-memory filtering for JSON fields for simplicity in this step.

        let results = await query.where(and(...conditions)).all();

        if (city) {
            results = results.filter(p => {
                try {
                    const loc = typeof p.location === 'string' ? JSON.parse(p.location) : p.location;
                    return loc && loc.city && loc.city.toLowerCase().includes(String(city).toLowerCase());
                } catch (e) {
                    return false;
                }
            });
        }

        logger.info('Properties fetched', { count: results.length });

        // Parse JSON fields back to objects for response
        const formattedResults = results.map(p => ({
            ...p,
            location: p.location,
            amenities: p.amenities || [],
            images: p.images || [],
        }));

        return {
            status: 200,
            body: { properties: formattedResults, total: formattedResults.length },
        };
    } catch (error) {
        logger.error('Error fetching properties', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
