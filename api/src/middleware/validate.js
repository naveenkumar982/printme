/**
 * Zod validation middleware.
 * Validates req.body, req.query, or req.params against a Zod schema.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), controller.register);
 *   router.get('/items', validate(querySchema, 'query'), controller.list);
 */
export function validate(schema, source = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                field: issue.path.join('.'),
                message: issue.message,
            }));

            return res.status(400).json({
                error: 'Validation failed',
                details: errors,
            });
        }

        // Replace with parsed (& transformed) data
        req[source] = result.data;
        next();
    };
}
