import { z } from 'zod';

// Register validation
const registerSchema = z.object({
    email: z.string()
        .email('Invalid email address')
        .min(5, 'Email must be at least 5 characters')
        .max(255, 'Email is too long'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password is too long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),

    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
        .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

    role: z.enum(['user', 'admin']).optional().default('user'),
});

// Login validation
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

// Change password validation
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'New password must contain at least one number'),
});

// Update profile validation
const updateProfileSchema = z.object({
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long')
        .optional(),

    email: z.string()
        .email('Invalid email address')
        .optional(),
});

// Infer types
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    updateProfileSchema,
}