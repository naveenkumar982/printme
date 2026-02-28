import { z } from 'zod';

// ── Query Schemas ──

export const listProductsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    search: z.string().trim().optional(),
    active: z.coerce.boolean().optional(),
    sortBy: z.string().trim().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
});

export const productIdSchema = z.object({
    id: z.string().min(1, 'Product ID is required'),
});

// ── Admin Schemas ──

export const createProductSchema = z.object({
    name: z.string().min(2).max(100).trim(),
    slug: z
        .string()
        .min(2)
        .max(100)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
        .trim(),
    description: z.string().max(2000).trim().optional().nullable(),
    basePrice: z.number().positive('Price must be positive'),
    imageUrl: z.string().url().optional().nullable(),
    active: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

export const createSkuSchema = z.object({
    size: z.string().min(1).max(20).trim(),
    color: z.string().min(1).max(30).trim(),
    stock: z.number().int().min(0).default(0),
    price: z.number().positive('Price must be positive'),
});

export const createTemplateSchema = z.object({
    name: z.string().min(2).max(100).trim(),
    canvasJson: z.string().min(1, 'Canvas JSON is required'),
    thumbUrl: z.string().url().optional().nullable(),
});
