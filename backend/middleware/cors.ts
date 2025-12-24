import { ApiMiddleware } from 'motia';

export const corsMiddleware: ApiMiddleware = async (req, ctx, next) => {
    const headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3001', // Allow frontend
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
    };

    // Check if this is a CORS preflight request by looking for the preflight header
    // Note: ApiRequest doesn't have 'method' property - the HTTP method is defined in step config
    const isPreflight = req.headers?.['access-control-request-method'] !== undefined;

    if (isPreflight) {
        return {
            status: 204,
            headers,
            body: {}
        };
    }

    const response = await next();

    return {
        ...response,
        headers: {
            ...response.headers,
            ...headers,
        }
    };
};
