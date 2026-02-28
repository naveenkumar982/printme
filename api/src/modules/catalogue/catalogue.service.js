import prisma from '../../lib/prisma.js';

// ── Product Queries ──

/**
 * List products with pagination and optional search.
 */
export async function listProducts({ page = 1, limit = 12, search, active, sortBy, minPrice, maxPrice }) {
    const skip = (page - 1) * limit;

    const where = {};
    if (active !== undefined) where.active = active;
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
        ];
    }
    if (minPrice || maxPrice) {
        where.basePrice = {};
        if (minPrice) where.basePrice.gte = parseFloat(minPrice);
        if (maxPrice) where.basePrice.lte = parseFloat(maxPrice);
    }

    // Determine sort order
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { basePrice: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { basePrice: 'desc' };
    else if (sortBy === 'name_asc') orderBy = { name: 'asc' };

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                basePrice: true,
                imageUrl: true,
                active: true,
                createdAt: true,
                _count: { select: { skus: true, templates: true } },
            },
        }),
        prisma.product.count({ where }),
    ]);

    return {
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get a single product by ID with its SKUs and templates.
 */
export async function getProductById(id) {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            skus: {
                orderBy: [{ size: 'asc' }, { color: 'asc' }],
            },
            templates: {
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    canvasJson: true,
                    thumbUrl: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    return product;
}

/**
 * Get product by slug (for public URLs).
 */
export async function getProductBySlug(slug) {
    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            skus: {
                where: { stock: { gt: 0 } },
                orderBy: [{ size: 'asc' }, { color: 'asc' }],
            },
            templates: {
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    canvasJson: true,
                    thumbUrl: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    return product;
}

/**
 * Get SKUs for a product.
 */
export async function getProductSkus(productId) {
    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    return prisma.sku.findMany({
        where: { productId },
        orderBy: [{ size: 'asc' }, { color: 'asc' }],
    });
}

/**
 * Get templates for a product.
 */
export async function getProductTemplates(productId) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    return prisma.template.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            canvasJson: true,
            thumbUrl: true,
            createdAt: true,
        },
    });
}

// ── Admin Product CRUD ──

/**
 * Create a new product (admin only).
 */
export async function createProduct(data) {
    return prisma.product.create({
        data,
        include: { _count: { select: { skus: true, templates: true } } },
    });
}

/**
 * Update a product (admin only).
 */
export async function updateProduct(id, data) {
    return prisma.product.update({
        where: { id },
        data,
        include: { _count: { select: { skus: true, templates: true } } },
    });
}

/**
 * Delete a product and all cascading records (admin only).
 */
export async function deleteProduct(id) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    await prisma.product.delete({ where: { id } });
    return { deleted: true };
}

// ── Admin SKU CRUD ──

/**
 * Add a SKU to a product (admin only).
 */
export async function addSku(productId, data) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    return prisma.sku.create({
        data: { ...data, productId },
    });
}

/**
 * Delete a SKU (admin only).
 */
export async function deleteSku(skuId) {
    const sku = await prisma.sku.findUnique({ where: { id: skuId } });
    if (!sku) {
        const err = new Error('SKU not found');
        err.status = 404;
        throw err;
    }

    await prisma.sku.delete({ where: { id: skuId } });
    return { deleted: true };
}

// ── Admin Template CRUD ──

/**
 * Add a template to a product (admin only).
 */
export async function addTemplate(productId, data) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        const err = new Error('Product not found');
        err.status = 404;
        throw err;
    }

    return prisma.template.create({
        data: { ...data, productId },
    });
}

/**
 * Delete a template (admin only).
 */
export async function deleteTemplate(templateId) {
    const tmpl = await prisma.template.findUnique({ where: { id: templateId } });
    if (!tmpl) {
        const err = new Error('Template not found');
        err.status = 404;
        throw err;
    }

    await prisma.template.delete({ where: { id: templateId } });
    return { deleted: true };
}
