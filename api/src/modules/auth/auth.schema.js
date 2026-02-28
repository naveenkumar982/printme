import { z } from 'zod';

export const registerSchema = z.object({
    email: z
        .string()
        .email('Invalid email address')
        .min(1, 'Email is required')
        .transform((v) => v.toLowerCase().trim()),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be at most 100 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters')
        .trim()
        .optional(),
});

export const loginSchema = z.object({
    email: z
        .string()
        .email('Invalid email address')
        .min(1, 'Email is required')
        .transform((v) => v.toLowerCase().trim()),
    password: z
        .string()
        .min(1, 'Password is required'),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters')
        .trim()
        .optional(),
    avatarUrl: z
        .string()
        .url('Invalid URL')
        .optional()
        .nullable(),
});

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'New password must be at least 8 characters')
        .max(100, 'New password must be at most 100 characters')
        .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'New password must contain at least one number'),
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must differ from current password',
    path: ['newPassword'],
});
