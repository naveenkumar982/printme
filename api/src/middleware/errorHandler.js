/**
 * Global error handler middleware.
 * Catches unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(err, _req, res, _next) {
    console.error('[Error]', err.stack || err.message);

    // Prisma known errors
    if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'field';
        return res.status(409).json({
            error: `A record with this ${field} already exists`,
            code: 'DUPLICATE_ENTRY',
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Record not found',
            code: 'NOT_FOUND',
        });
    }

    // Default
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
}
