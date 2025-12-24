import { ApiRouteConfig, Handlers } from 'motia';
import { corsMiddleware } from '../middleware/cors';
import { db } from '../db';
import { carts } from '../db/schema';
import { eq } from 'drizzle-orm';

// Delete Cart Item (DELETE)
export const config: ApiRouteConfig = {
    name: 'DeleteCartItem',
    type: 'api',
    path: '/api/cart/:id',
    method: 'DELETE',
    middleware: [corsMiddleware],
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['DeleteCartItem'] = async (req, { logger }) => {
    try {
        const { id } = req.pathParams as { id: string };

        if (!id) {
            return {
                status: 400,
                body: { error: 'Cart item id is required' },
            };
        }

        // Check if cart item exists
        const cartItem = await db.select().from(carts).where(eq(carts.id, id)).get();
        if (!cartItem) {
            return {
                status: 404,
                body: { error: 'Cart item not found' },
            };
        }

        // Delete the cart item
        await db.delete(carts).where(eq(carts.id, id)).run();

        logger.info('Cart item deleted', { id });

        return {
            status: 200,
            body: { message: 'Cart item removed successfully' },
        };
    } catch (error) {
        logger.error('Error deleting cart item', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
