import prisma from '../../lib/prisma.js';

export async function listWishlist(userId) {
    return prisma.wishlist.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            product: {
                select: {
                    id: true, name: true, slug: true, basePrice: true, imageUrl: true,
                    _count: { select: { skus: true } },
                },
            },
        },
    });
}

export async function toggleWishlist(userId, productId) {
    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    const existing = await prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } },
    });

    if (existing) {
        await prisma.wishlist.delete({ where: { id: existing.id } });
        return { wishlisted: false };
    }

    await prisma.wishlist.create({ data: { userId, productId } });
    return { wishlisted: true };
}

export async function removeFromWishlist(userId, productId) {
    const existing = await prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } },
    });
    if (!existing) {
        const err = new Error('Not in wishlist');
        err.status = 404;
        throw err;
    }
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return { removed: true };
}

export async function getWishlistIds(userId) {
    const items = await prisma.wishlist.findMany({
        where: { userId },
        select: { productId: true },
    });
    return items.map((i) => i.productId);
}
