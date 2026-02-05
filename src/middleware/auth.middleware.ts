import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import config from '../utils/config';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';


const db = config.db;

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: string;
            };
        }
    }
}

// Authentication middleware
const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required',
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);

        // Check if user still exists
        const [user] = await db.select()
            .from(usersTable)
            .where(eq(usersTable.id, decoded.userId))
            .limit(1);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'User not found or inactive',
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role as string,
        };

        next();

    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: 'INVALID_TOKEN',
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                requiredRoles: roles,
                yourRole: req.user.role,
            });
        }

        next();
    };
};


export {
    authenticate,
    authorize,
}