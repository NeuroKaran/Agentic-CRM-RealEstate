import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { z } from 'zod';
import { db } from '../db';
import { properties, carts, leads } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema for adding to cart
const addToCartSchema = z.object({
    buyerId: z.string(),
    propertyId: z.string(),
    notes: z.string().optional(),
});

// Add to Cart (POST)
export const config: ApiRouteConfig = {
    name: 'AddToCart',
    type: 'api',
    path: '/api/cart',
    method: 'POST',
    middleware: [corsMiddleware],
    emits: ['cart.item.added', 'seller.notification'],
    flows: ['CRM'], // Matches user edit
};

export const handler: Handlers['AddToCart'] = async (req, { emit, logger }) => {
    try {
        const parsed = addToCartSchema.safeParse(req.body);

        if (!parsed.success) {
            return {
                status: 400,
                body: { error: 'Validation failed', details: parsed.error.flatten() },
            };
        }

        const { buyerId, propertyId, notes } = parsed.data;

        // Check if property exists
        const property = await db.select().from(properties).where(eq(properties.id, propertyId)).get();
        if (!property) {
            return {
                status: 404,
                body: { error: 'Property not found' },
            };
        }

        // Check if already in cart
        const existingItem = await db.select()
            .from(carts)
            .where(and(eq(carts.buyerId, buyerId), eq(carts.propertyId, propertyId)))
            .get();

        if (existingItem) {
            return {
                status: 409,
                body: { error: 'Property already in cart' },
            };
        }

        const cartId = `cart_${Date.now()}`;
        const cartItem = {
            id: cartId,
            buyerId,
            propertyId,
            notes,
        };

        // Add to cart
        await db.insert(carts).values(cartItem).run();

        // Track inquiry on property (increment inquiries)
        // Drizzle doesn't have an easy atomic increment in sqlite-core directly without raw sql usually, but we can do scalar update
        // Or just read-modify-write for MVP since low concurrency anticipated
        await db.update(properties)
            .set({ inquiries: (property.inquiries || 0) + 1 })
            .where(eq(properties.id, propertyId))
            .run();

        // Create lead for seller
        const leadId = `lead_${Date.now()}`;
        const lead = {
            id: leadId,
            buyerId,
            propertyId,
            sellerId: property.sellerId,
            status: 'new',
        };
        await db.insert(leads).values(lead).run();

        logger.info('Property added to cart', { buyerId, propertyId, leadId });

        // Emit events
        const emitFn = emit as (args: { topic: string; data: unknown }) => Promise<void>;
        await emitFn({ topic: 'cart.item.added', data: { buyerId, propertyId } });
        await emitFn({
            topic: 'seller.notification',
            data: {
                sellerId: property.sellerId,
                type: 'new_inquiry',
                message: `New inquiry for property: ${property.title}`,
                leadId,
            },
        });

        return {
            status: 201,
            body: { message: 'Property added to cart', cartId, leadId },
        };
    } catch (error) {
        logger.error('Error adding to cart', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
