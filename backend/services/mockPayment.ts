/**
 * Mock Payment Gateway Service
 * Simulates Stripe-like payment functionality for development/testing
 * Uses Luhn algorithm for card validation
 */

export interface PaymentResult {
    success: boolean;
    transactionId: string;
    error?: string;
    amount?: number;
    currency?: string;
}

export interface ChargeOptions {
    amount: number; // in cents
    currency?: string;
    cardNumber: string;
    description?: string;
}

export interface RefundOptions {
    transactionId: string;
    amount?: number; // partial refund if specified
    reason?: string;
}

// Simulated transaction storage (in-memory for mock)
const mockTransactions = new Map<string, {
    amount: number;
    currency: string;
    status: 'pending' | 'success' | 'failed' | 'refunded';
    createdAt: Date;
}>();

/**
 * Luhn algorithm for credit card validation
 * @param cardNumber - Card number to validate
 * @returns boolean - Whether the card number passes Luhn check
 */
function isValidLuhn(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Check if it's all digits
    if (!/^\d+$/.test(cleaned)) {
        return false;
    }

    // Check length (most cards are 13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) {
        return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

/**
 * Validate card number format and Luhn check
 */
export function validateCard(cardNumber: string): { valid: boolean; error?: string } {
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    if (!/^\d+$/.test(cleaned)) {
        return { valid: false, error: 'Card number must contain only digits' };
    }

    if (cleaned.length < 13 || cleaned.length > 19) {
        return { valid: false, error: 'Card number must be 13-19 digits' };
    }

    if (!isValidLuhn(cardNumber)) {
        return { valid: false, error: 'Invalid card number' };
    }

    return { valid: true };
}

/**
 * Generate a random transaction ID
 */
function generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Simulate network delay (100-500ms)
 */
async function simulateNetworkDelay(): Promise<void> {
    const delay = 100 + Math.random() * 400;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Charge a payment method
 * Simulates a successful charge with occasional failures for realism
 */
export async function charge(options: ChargeOptions): Promise<PaymentResult> {
    await simulateNetworkDelay();

    const { amount, currency = 'USD', cardNumber, description } = options;

    // Validate card
    const validation = validateCard(cardNumber);
    if (!validation.valid) {
        return {
            success: false,
            transactionId: '',
            error: validation.error,
        };
    }

    // Validate amount
    if (amount <= 0) {
        return {
            success: false,
            transactionId: '',
            error: 'Amount must be greater than 0',
        };
    }

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
        return {
            success: false,
            transactionId: '',
            error: 'Payment declined by issuer',
        };
    }

    // Generate transaction
    const transactionId = generateTransactionId();

    // Store in mock storage
    mockTransactions.set(transactionId, {
        amount,
        currency,
        status: 'success',
        createdAt: new Date(),
    });

    return {
        success: true,
        transactionId,
        amount,
        currency,
    };
}

/**
 * Refund a transaction
 */
export async function refund(options: RefundOptions): Promise<PaymentResult> {
    await simulateNetworkDelay();

    const { transactionId, amount, reason } = options;

    // Check if transaction exists
    const transaction = mockTransactions.get(transactionId);
    if (!transaction) {
        return {
            success: false,
            transactionId,
            error: 'Transaction not found',
        };
    }

    // Check if already refunded
    if (transaction.status === 'refunded') {
        return {
            success: false,
            transactionId,
            error: 'Transaction already refunded',
        };
    }

    // Calculate refund amount
    const refundAmount = amount ?? transaction.amount;

    if (refundAmount > transaction.amount) {
        return {
            success: false,
            transactionId,
            error: 'Refund amount exceeds original transaction',
        };
    }

    // Update transaction status
    transaction.status = 'refunded';
    mockTransactions.set(transactionId, transaction);

    // Generate refund transaction
    const refundTransactionId = generateTransactionId();
    mockTransactions.set(refundTransactionId, {
        amount: -refundAmount,
        currency: transaction.currency,
        status: 'success',
        createdAt: new Date(),
    });

    return {
        success: true,
        transactionId: refundTransactionId,
        amount: refundAmount,
        currency: transaction.currency,
    };
}

/**
 * Get subscription pricing based on plan
 */
export function getSubscriptionPricing(plan: 'monthly' | 'quarterly' | 'yearly', agentType: 'ai' | 'human'): {
    pricePerMonth: number;
    totalAmount: number;
    discount: number;
} {
    // Base monthly prices in cents
    const basePrices = {
        ai: 4999,    // $49.99/month
        human: 9999, // $99.99/month
    };

    const basePrice = basePrices[agentType];

    const planDetails = {
        monthly: { months: 1, discount: 0 },
        quarterly: { months: 3, discount: 0.10 }, // 10% discount
        yearly: { months: 12, discount: 0.20 },   // 20% discount
    };

    const { months, discount } = planDetails[plan];
    const discountedPrice = Math.round(basePrice * (1 - discount));
    const totalAmount = discountedPrice * months;

    return {
        pricePerMonth: discountedPrice,
        totalAmount,
        discount,
    };
}

/**
 * Calculate period end date based on plan
 */
export function calculatePeriodEnd(startDate: Date, plan: 'monthly' | 'quarterly' | 'yearly'): Date {
    const endDate = new Date(startDate);

    switch (plan) {
        case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case 'quarterly':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
        case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
    }

    return endDate;
}

/**
 * Calculate prorated refund for early termination
 */
export function calculateProratedRefund(
    pricePerMonth: number,
    periodStart: Date,
    periodEnd: Date,
    terminationDate: Date = new Date()
): number {
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const usedDays = Math.ceil((terminationDate.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, totalDays - usedDays);

    const monthsInPeriod = totalDays / 30;
    const totalPaid = pricePerMonth * monthsInPeriod;
    const dailyRate = totalPaid / totalDays;

    return Math.round(dailyRate * remainingDays);
}

// Export the mock payment service
export const mockPayment = {
    charge,
    refund,
    validateCard,
    getSubscriptionPricing,
    calculatePeriodEnd,
    calculateProratedRefund,
};

export default mockPayment;
