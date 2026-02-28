import { z } from 'zod';

export const createAddressSchema = z.object({
    label: z.string().max(50).default('Home'),
    line1: z.string().min(1, 'Address line 1 is required').max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    zip: z.string().min(1, 'ZIP is required').max(20),
    country: z.string().max(2).default('IN'),
});

export const updateAddressSchema = z.object({
    label: z.string().max(50).optional(),
    line1: z.string().min(1).max(200).optional(),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    zip: z.string().min(1).max(20).optional(),
    country: z.string().max(2).optional(),
});
