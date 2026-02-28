import prisma from '../../lib/prisma.js';

/**
 * Valid status transitions for orders.
 */
const STATUS_TRANSITIONS = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['PROCESSING', 'REFUNDED'],
    PROCESSING: ['SHIPPED', 'REFUNDED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
};

/**
 * Create an order with idempotency protection.
 * Uses a $transaction for atomicity:
 * 1. Check idempotency key
 * 2. Verify all SKUs exist and have stock
 * 3. Calculate server-side prices
 * 4. Create order + items + address
 *
 * @returns {Order}
 */
export async function createOrder(userId, { items, address, idempotencyKey }) {
    return prisma.$transaction(async (tx) => {
        // 1. Idempotency check — return existing order if key already used
        const existingOrder = await tx.order.findUnique({
            where: { idempotencyKey },
            include: {
                items: { include: { sku: true } },
                address: true,
            },
        });

        if (existingOrder) {
            return existingOrder;
        }

        // 2. Fetch and validate all SKUs
        let totalAmount = 0;
        const resolvedItems = [];

        for (const item of items) {
            const sku = await tx.sku.findUnique({
                where: { id: item.skuId },
                include: { product: { select: { name: true, active: true } } },
            });

            if (!sku) {
                const err = new Error(`SKU not found: ${item.skuId}`);
                err.status = 400;
                throw err;
            }

            if (!sku.product.active) {
                const err = new Error(`Product "${sku.product.name}" is no longer available`);
                err.status = 400;
                throw err;
            }

            if (sku.stock < item.quantity) {
                const err = new Error(
                    `Insufficient stock for ${sku.product.name} (${sku.size}/${sku.color}). Available: ${sku.stock}, requested: ${item.quantity}`
                );
                err.status = 400;
                throw err;
            }

            // Server-side price calculation (never trust client prices)
            const unitPrice = Number(sku.price);
            totalAmount += unitPrice * item.quantity;

            resolvedItems.push({
                skuId: sku.id,
                quantity: item.quantity,
                unitPrice,
                canvasJson: item.canvasJson || null,
            });
        }

        // 3. Create address
        const savedAddress = await tx.address.create({
            data: {
                userId,
                label: address.label,
                line1: address.line1,
                line2: address.line2 || null,
                city: address.city,
                state: address.state,
                zip: address.zip,
                country: address.country,
            },
        });

        // 4. Create order with items
        const order = await tx.order.create({
            data: {
                userId,
                status: 'PENDING',
                totalAmount,
                idempotencyKey,
                addressId: savedAddress.id,
                items: {
                    create: resolvedItems,
                },
            },
            include: {
                items: {
                    include: {
                        sku: {
                            include: { product: { select: { name: true } } },
                        },
                    },
                },
                address: true,
            },
        });

        return order;
    });
}

/**
 * List orders for a user with pagination.
 */
export async function listOrders(userId, { page = 1, limit = 10, status }) {
    const skip = (page - 1) * limit;
    const where = { userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: {
                        sku: {
                            include: { product: { select: { name: true, imageUrl: true } } },
                        },
                    },
                },
                address: true,
            },
        }),
        prisma.order.count({ where }),
    ]);

    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

/**
 * Get a single order by ID (owned by user).
 */
export async function getOrderById(userId, orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: {
                include: {
                    sku: {
                        include: { product: { select: { name: true, imageUrl: true } } },
                    },
                },
            },
            address: true,
        },
    });

    if (!order) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
    }

    if (order.userId !== userId) {
        const err = new Error('Unauthorized access to this order');
        err.status = 403;
        throw err;
    }

    return order;
}

/**
 * Cancel an order (only if PENDING).
 */
export async function cancelOrder(userId, orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, status: true },
    });

    if (!order) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
    }

    if (order.userId !== userId) {
        const err = new Error('Unauthorized');
        err.status = 403;
        throw err;
    }

    if (!STATUS_TRANSITIONS[order.status]?.includes('CANCELLED')) {
        const err = new Error(`Cannot cancel order in ${order.status} status`);
        err.status = 400;
        throw err;
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { items: true, address: true },
    });
}

/**
 * Update order status (admin or webhook use).
 * Enforces valid status transitions.
 */
export async function updateOrderStatus(orderId, newStatus, extraData = {}) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, status: true },
    });

    if (!order) {
        const err = new Error('Order not found');
        err.status = 404;
        throw err;
    }

    const validTargets = STATUS_TRANSITIONS[order.status] || [];
    if (!validTargets.includes(newStatus)) {
        const err = new Error(
            `Invalid transition: ${order.status} → ${newStatus}. Valid: ${validTargets.join(', ') || 'none'}`
        );
        err.status = 400;
        throw err;
    }

    return prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus, ...extraData },
        include: {
            items: { include: { sku: true } },
            address: true,
        },
    });
}

/**
 * Deduct stock for all items in an order.
 * Called after successful payment.
 */
export async function deductStock(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });

    if (!order) return;

    await prisma.$transaction(
        order.items.map((item) =>
            prisma.sku.update({
                where: { id: item.skuId },
                data: { stock: { decrement: item.quantity } },
            })
        )
    );
}
