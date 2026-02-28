import prisma from '../../lib/prisma.js';

export async function createReview(userId, { productId, rating, comment }) {
    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    // One review per user per product (upsert)
    return prisma.review.upsert({
        where: { userId_productId: { userId, productId } },
        update: { rating, comment },
        create: { userId, productId, rating, comment },
        include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
        },
    });
}

export async function listReviews(productId) {
    const reviews = await prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
        },
    });

    // Calculate average
    const avg = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return { reviews, averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length };
}

export async function deleteReview(userId, reviewId) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.userId !== userId) {
        const err = new Error('Review not found');
        err.status = 404;
        throw err;
    }
    await prisma.review.delete({ where: { id: reviewId } });
    return { deleted: true };
}
