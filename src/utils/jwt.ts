import config from '../utils/config'
import jwt from 'jsonwebtoken';

// Token payload interface
export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
}

// Generate access token
export function generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: '7d',
    });
}

// Generate refresh token
export function generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, config.jwtSecret, {
        expiresIn: '7d',
    });
}

// Verify access token
export function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

// Verify refresh token
export function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

// Extract token from header
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7); // Remove "Bearer "
}