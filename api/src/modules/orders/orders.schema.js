import { z } from 'zod';

const orderItemSchema = z.object({
    skuId: z.string().min(1, 'SKU ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99),
    canvasJson: z.string().optional().nullable(),
});

const addressSchema = z.object({
    label: z.string().max(50).default('Home'),
    line1: z.string().min(1, 'Address line 1 is required').max(200),
    line2: z.string().max(200).optional().nullable(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    zip: z.string().min(1, 'ZIP code is required').max(20),
    country: z.string().max(5).default('IN'),
});

export const createOrderSchema = z.object({
    items: z
        .array(orderItemSchema)
        .min(1, 'At least one item is required')
        .max(20, 'Maximum 20 items per order'),
    address: addressSchema,
    idempotencyKey: z
        .string()
        .min(1, 'Idempotency key is required')
        .max(64, 'Idempotency key too long'),
});

export const listOrdersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(20).default(10),
    status: z.string().optional(),
});
