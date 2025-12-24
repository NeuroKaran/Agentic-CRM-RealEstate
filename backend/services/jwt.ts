/**
 * JWT Service for Authentication
 * Simple JWT implementation using base64 encoding
 * Note: For production, use a proper JWT library like jsonwebtoken
 */

interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'grih-astha-secret-key-2024';
const TOKEN_EXPIRY_HOURS = 24;

/**
 * Simple base64 encode/decode helpers
 */
function base64Encode(str: string): string {
    return Buffer.from(str).toString('base64url');
}

function base64Decode(str: string): string {
    return Buffer.from(str, 'base64url').toString();
}

/**
 * Create a simple HMAC-like signature
 */
function createSignature(data: string, secret: string): string {
    // Simple hash combining data and secret
    let hash = 0;
    const combined = data + secret;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return base64Encode(hash.toString());
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string, email: string, role: string): string {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const payload: TokenPayload = {
        userId,
        email,
        role,
        exp: Date.now() + (TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    };

    const headerEncoded = base64Encode(JSON.stringify(header));
    const payloadEncoded = base64Encode(JSON.stringify(payload));
    const signature = createSignature(`${headerEncoded}.${payloadEncoded}`, JWT_SECRET);

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const [headerEncoded, payloadEncoded, signature] = parts;

        // Verify signature
        const expectedSignature = createSignature(`${headerEncoded}.${payloadEncoded}`, JWT_SECRET);
        if (signature !== expectedSignature) {
            console.log('[JWT] Invalid signature');
            return null;
        }

        // Decode payload
        const payload: TokenPayload = JSON.parse(base64Decode(payloadEncoded));

        // Check expiration
        if (payload.exp < Date.now()) {
            console.log('[JWT] Token expired');
            return null;
        }

        return payload;
    } catch (error) {
        console.error('[JWT] Token verification failed:', error);
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | undefined): string | null {
    if (!authHeader) {
        return null;
    }

    if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }

    return authHeader;
}

export default {
    generateToken,
    verifyToken,
    extractToken
};
