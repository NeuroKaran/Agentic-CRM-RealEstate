import { ApiRouteConfig, Handlers } from 'motia';
import { db } from '../db';
import { transactions, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const config: ApiRouteConfig = {
    name: 'ListTransactions',
    type: 'api',
    path: '/api/transactions',
    method: 'GET',
    emits: [],
    flows: ['CRM'],
};

export const handler: Handlers['ListTransactions'] = async (req, { logger }) => {
    try {
        const sellerId = (req.pathParams as { sellerId?: string })?.sellerId;

        if (!sellerId) {
            return {
                status: 400,
                body: { error: 'sellerId query parameter is required' },
            };
        }

        // Check if seller exists
        const seller = await db.select().from(users).where(eq(users.id, sellerId)).get();
        if (!seller || seller.role !== 'seller') {
            return {
                status: 404,
                body: { error: 'Seller not found' },
            };
        }

        // Get all transactions for this seller, ordered by date descending
        const sellerTransactions = await db
            .select()
            .from(transactions)
            .where(eq(transactions.sellerId, sellerId))
            .orderBy(desc(transactions.createdAt))
            .all();

        // Format transactions
        const formattedTransactions = sellerTransactions.map((txn) => ({
            ...txn,
            // Convert amount to dollars for display
            amountDisplay: `$${(Math.abs(txn.amount) / 100).toFixed(2)}`,
            isRefund: txn.amount < 0,
            createdAt: new Date(txn.createdAt).toISOString(),
        }));

        // Calculate summary
        const summary = {
            totalCharged: sellerTransactions
                .filter(t => t.amount > 0 && t.status === 'success')
                .reduce((sum, t) => sum + t.amount, 0),
            totalRefunded: sellerTransactions
                .filter(t => t.amount < 0 && t.status === 'success')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0),
            transactionCount: sellerTransactions.length,
        };

        logger.info('Listed transactions', { sellerId, count: formattedTransactions.length });

        return {
            status: 200,
            body: {
                transactions: formattedTransactions,
                summary: {
                    ...summary,
                    totalChargedDisplay: `$${(summary.totalCharged / 100).toFixed(2)}`,
                    totalRefundedDisplay: `$${(summary.totalRefunded / 100).toFixed(2)}`,
                    netAmountDisplay: `$${((summary.totalCharged - summary.totalRefunded) / 100).toFixed(2)}`,
                },
            },
        };
    } catch (error) {
        logger.error('Error listing transactions', { error });
        return {
            status: 500,
            body: { error: 'Internal server error' },
        };
    }
};
