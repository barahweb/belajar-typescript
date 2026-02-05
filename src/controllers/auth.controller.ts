import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import config from '../utils/config';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    updateProfileSchema,
    type RegisterDto,
    type LoginDto,
    type ChangePasswordDto
} from '../validations/auth.validation';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    type TokenPayload
} from '../utils/jwt';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';

const db = config.db;

export class AuthController {

    // POST /api/auth/register - Register new user
    static async register(req: Request, res: Response) {
        try {
            // Validate request
            const validatedData: RegisterDto = registerSchema.parse(req.body);

            // Check if user already exists
            const existingUser = await db.select()
                .from(usersTable)
                .where(eq(usersTable.email, validatedData.email))
                .limit(1);

            if (existingUser.length > 0) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already registered',
                });
            }

            // Hash password
            const hashedPassword = await hashPassword(validatedData.password);

            // Create user
            const [newUser] = await db.insert(usersTable)
                .values({
                    email: validatedData.email,
                    password: hashedPassword,
                    name: validatedData.name,
                    role: validatedData.role,
                })
                .returning();

            // Remove password from response
            const { password, refreshToken, ...userWithoutSensitive } = newUser;

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: userWithoutSensitive,
            });

        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues[0].message,
                });
            }

            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed',
            });
        }
    }

    // POST /api/auth/login - Login user // 
    static async login(req: Request, res: Response) {
        try {
            // Validate request
            const { email, password }: LoginDto = loginSchema.parse(req.body);

            // Find user
            const [user] = await db.select()
                .from(usersTable)
                .where(eq(usersTable.email, email))
                .limit(1);

            // Check if user exists and is active
            if (!user || !user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password',
                });
            }

            // Verify password
            const isValidPassword = await comparePassword(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid email or password',
                });
            }

            // Update last login
            await db.update(usersTable)
                .set({ lastLogin: new Date() })
                .where(eq(usersTable.id, user.id));

            // Generate tokens
            const tokenPayload: TokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role!,
            };

            const accessToken = generateAccessToken(tokenPayload);
            const refreshToken = generateRefreshToken(tokenPayload);

            // Save refresh token to database (optional)
            await db.update(usersTable)
                .set({ refreshToken })
                .where(eq(usersTable.id, user.id));

            // Remove sensitive data
            const { password: _, refreshToken: __, ...userWithoutSensitive } = user;

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userWithoutSensitive,
                    tokens: {
                        accessToken,
                        refreshToken,
                        expiresIn: process.env.JWT_EXPIRES_IN,
                    },
                },
            });

        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues[0],
                });
            }

            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed',
            });
        }
    }

    // Refresh access token
    static async refreshToken(req: Request, res: Response) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    error: 'Refresh token is required',
                });
            }

            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // Check if token exists in database
            const [user] = await db.select()
                .from(usersTable)
                .where(eq(usersTable.refreshToken, refreshToken))
                .limit(1);

            if (!user || user.id !== decoded.userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid refresh token',
                });
            }

            // Generate new access token
            const tokenPayload: TokenPayload = {
                userId: user.id,
                email: user.email,
                role: user.role!,
            };

            const newAccessToken = generateAccessToken(tokenPayload);

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    expiresIn: process.env.JWT_EXPIRES_IN,
                },
            });

        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Refresh token expired',
                });
            }

            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid refresh token',
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to refresh token',
            });
        }
    }

    // GET /api/auth/profile - Get current user profile // 
    static async getProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
            }

            const [user] = await db.select()
                .from(usersTable)
                .where(eq(usersTable.id, req.user.id))
                .limit(1);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }

            // Remove sensitive data
            const { password, refreshToken, ...userWithoutSensitive } = user;

            res.json({
                success: true,
                data: userWithoutSensitive,
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get profile',
            });
        }
    }

    // Update user profile
    static async updateProfile(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
            }

            const validatedData = updateProfileSchema.parse(req.body);

            // Check if email is being changed and if it already exists
            if (validatedData.email && validatedData.email !== req.user.email) {
                const existingUser = await db.select()
                    .from(usersTable)
                    .where(eq(usersTable.email, validatedData.email))
                    .limit(1);

                if (existingUser.length > 0) {
                    return res.status(409).json({
                        success: false,
                        error: 'Email already in use',
                    });
                }
            }

            const [updatedUser] = await db.update(usersTable)
                .set({
                    ...validatedData,
                    updatedAt: new Date(),
                })
                .where(eq(usersTable.id, req.user.id))
                .returning();

            const { password, refreshToken, ...userWithoutSensitive } = updatedUser;

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: userWithoutSensitive,
            });

        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues[0],
                });
            }

            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update profile',
            });
        }
    }

    // Change password
    static async changePassword(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
            }

            const { currentPassword, newPassword }: ChangePasswordDto = changePasswordSchema.parse(req.body);

            // Get user with password
            const [user] = await db.select()
                .from(usersTable)
                .where(eq(usersTable.id, req.user.id))
                .limit(1);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                });
            }

            // Verify current password
            const isValidPassword = await comparePassword(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Current password is incorrect',
                });
            }

            // Validate new password
            const validation = validatePassword(newPassword);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: validation.message,
                });
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update password
            await db.update(usersTable)
                .set({
                    password: hashedPassword,
                    updatedAt: new Date(),
                })
                .where(eq(usersTable.id, req.user.id));

            // Invalidate all refresh tokens (optional)
            await db.update(usersTable)
                .set({ refreshToken: null })
                .where(eq(usersTable.id, req.user.id));

            res.json({
                success: true,
                message: 'Password changed successfully',
            });

        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.issues[0],
                });
            }

            console.error('Change password error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to change password',
            });
        }
    }

    // Logout
    static async logout(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
            }

            // Remove refresh token from database
            await db.update(usersTable)
                .set({ refreshToken: null })
                .where(eq(usersTable.id, req.user.id));

            res.json({
                success: true,
                message: 'Logged out successfully',
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout failed',
            });
        }
    }

    // GET /api/auth/check - Check authentication status
    static async checkAuth(req: Request, res: Response) {
        // res.json({
        //     user: req.user
        // });
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    authenticated: false,
                });
            }

            const [user] = await db.select()
                .from(usersTable)
                .where(eq(usersTable.id, req.user.id))
                .limit(1);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    authenticated: false,
                });
            }

            res.json({
                success: true,
                authenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                authenticated: false,
                error: 'Authentication check failed',
            });
        }
    }
}