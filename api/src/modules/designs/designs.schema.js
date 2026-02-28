import { z } from 'zod';

export const createDesignSchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(100, 'Name must be at most 100 characters')
        .trim()
        .default('Untitled'),
    canvasJson: z
        .string()
        .min(1, 'Canvas JSON is required'),
    thumbUrl: z
        .string()
        .url('Invalid URL')
        .optional()
        .nullable(),
});

export const updateDesignSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(100)
        .trim()
        .optional(),
    canvasJson: z
        .string()
        .min(1)
        .optional(),
    thumbUrl: z
        .string()
        .url()
        .optional()
        .nullable(),
});

export const listDesignsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(20).default(10),
});
