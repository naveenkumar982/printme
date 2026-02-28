import prisma from '../../lib/prisma.js';

const MAX_DESIGNS_PER_USER = 5;

/**
 * Create a new design with atomic count check.
 * Uses a $transaction to prevent race conditions on the max-5 limit.
 * @returns {Design}
 */
export async function createDesign(userId, data) {
    return prisma.$transaction(async (tx) => {
        // Count existing designs for this user
        const count = await tx.design.count({ where: { userId } });

        if (count >= MAX_DESIGNS_PER_USER) {
            const err = new Error(`Maximum ${MAX_DESIGNS_PER_USER} designs allowed. Delete an existing design to create a new one.`);
            err.status = 403;
            throw err;
        }

        return tx.design.create({
            data: {
                userId,
                name: data.name,
                canvasJson: data.canvasJson,
                thumbUrl: data.thumbUrl || null,
            },
            select: {
                id: true,
                name: true,
                canvasJson: true,
                thumbUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    });
}

/**
 * List designs for a user with pagination.
 */
export async function listDesigns(userId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    const [designs, total] = await Promise.all([
        prisma.design.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                name: true,
                thumbUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma.design.count({ where: { userId } }),
    ]);

    return {
        designs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            remaining: Math.max(0, MAX_DESIGNS_PER_USER - total),
        },
    };
}

/**
 * Get a single design by ID (only if owned by user).
 */
export async function getDesignById(userId, designId) {
    const design = await prisma.design.findUnique({
        where: { id: designId },
        select: {
            id: true,
            userId: true,
            name: true,
            canvasJson: true,
            thumbUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!design) {
        const err = new Error('Design not found');
        err.status = 404;
        throw err;
    }

    if (design.userId !== userId) {
        const err = new Error('Unauthorized access to this design');
        err.status = 403;
        throw err;
    }

    const { userId: _, ...safeDesign } = design;
    return safeDesign;
}

/**
 * Update a design (only by owner).
 */
export async function updateDesign(userId, designId, data) {
    // Verify ownership
    const existing = await prisma.design.findUnique({
        where: { id: designId },
        select: { userId: true },
    });

    if (!existing) {
        const err = new Error('Design not found');
        err.status = 404;
        throw err;
    }

    if (existing.userId !== userId) {
        const err = new Error('Unauthorized access to this design');
        err.status = 403;
        throw err;
    }

    return prisma.design.update({
        where: { id: designId },
        data,
        select: {
            id: true,
            name: true,
            canvasJson: true,
            thumbUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}

/**
 * Delete a design (only by owner).
 */
export async function deleteDesign(userId, designId) {
    const existing = await prisma.design.findUnique({
        where: { id: designId },
        select: { userId: true },
    });

    if (!existing) {
        const err = new Error('Design not found');
        err.status = 404;
        throw err;
    }

    if (existing.userId !== userId) {
        const err = new Error('Unauthorized access to this design');
        err.status = 403;
        throw err;
    }

    await prisma.design.delete({ where: { id: designId } });
    return { deleted: true };
}
