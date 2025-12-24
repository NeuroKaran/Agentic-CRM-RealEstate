import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { db } from '../db';
import { carts, properties } from '../db/schema';
import { eq } from 'drizzle-orm';

// Get Cart Items (GET)
export const config: ApiRouteConfig = {
    name: 'GetCart',
    type: 'api',
    path: '/api/cart',
    method: 'GET',
    middleware: [corsMiddleware],
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['GetCart'] = async (req, { logger }) => {
    try {
        const buyerId = req.queryParams.buyerId as string;

        if (!buyerId) {
            return {
                status: 400,
                body: { error: 'buyerId is required' },
            };
        }

        // Get cart items with property details
        const cartItems = await db.select().from(carts).where(eq(carts.buyerId, buyerId)).all();

        // Fetch property details for each cart item
        const itemsWithDetails = await Promise.all(
            cartItems.map(async (item) => {
                const property = await db.select().from(properties).where(eq(properties.id, item.propertyId)).get();
                return {
                    id: item.id,
                    propertyId: item.propertyId,
                    notes: item.notes,
                    addedAt: item.addedAt,
                    property: property ? {
                        id: property.id,
                        title: property.title,
                        price: property.price,
                        location: property.location,
                        bedrooms: property.bedrooms,
                        bathrooms: property.bathrooms,
                        size: property.size,
                        images: property.images,
                        propertyType: property.propertyType,
                    } : null,
                };
            })
        );

        logger.info('Cart fetched', { buyerId, count: itemsWithDetails.length });

        return {
            status: 200,
            body: { items: itemsWithDetails, count: itemsWithDetails.length },
        };
    } catch (error) {
        logger.error('Error fetching cart', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
