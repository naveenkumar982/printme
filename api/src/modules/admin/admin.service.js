import prisma from '../../lib/prisma.js';
import queue from '../../lib/queue.js';

/**
 * Valid status transitions (same as orders.service.js).
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
 * Admin: List all orders with pagination and filters.
 */
export async function adminListOrders({ page = 1, limit = 20, status, userId, search }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (search) {
        where.OR = [
            { id: { contains: search } },
            { user: { email: { contains: search } } },
            { user: { name: { contains: search } } },
        ];
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, email: true, name: true } },
                items: {
                    include: {
                        sku: {
                            include: { product: { select: { name: true } } },
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
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
}

/**
 * Admin: Get order detail.
 */
export async function adminGetOrder(orderId) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: { select: { id: true, email: true, name: true, phone: true } },
            items: {
                include: {
                    sku: { include: { product: { select: { name: true, imageUrl: true } } } },
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

    return order;
}

/**
 * Admin: Update order status with strict transition guard.
 * Enqueues notification and render jobs when appropriate.
 */
export async function adminUpdateOrderStatus(orderId, newStatus) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: { select: { email: true } },
            items: true,
        },
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

    const updated = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
        include: {
            user: { select: { id: true, email: true, name: true } },
            items: { include: { sku: true } },
            address: true,
        },
    });

    // ── Side Effects ──

    // On PAID → enqueue render jobs for items with canvasJson
    if (newStatus === 'PAID') {
        for (const item of order.items) {
            if (item.canvasJson) {
                await queue.enqueue({
                    type: 'RENDER_PRINT',
                    payload: {
                        orderId: order.id,
                        orderItemId: item.id,
                        canvasJson: item.canvasJson,
                    },
                });
            }
        }

        // Send payment confirmed notification
        await queue.enqueue({
            type: 'SEND_NOTIFICATION',
            payload: {
                type: 'ORDER_CONFIRMED',
                orderId: order.id,
                email: order.user.email,
            },
        });
    }

    // On SHIPPED → send shipped notification
    if (newStatus === 'SHIPPED') {
        await queue.enqueue({
            type: 'SEND_NOTIFICATION',
            payload: {
                type: 'ORDER_SHIPPED',
                orderId: order.id,
                email: order.user.email,
            },
        });
    }

    // On DELIVERED → send delivered notification
    if (newStatus === 'DELIVERED') {
        await queue.enqueue({
            type: 'SEND_NOTIFICATION',
            payload: {
                type: 'ORDER_DELIVERED',
                orderId: order.id,
                email: order.user.email,
            },
        });
    }

    return updated;
}

/**
 * Admin: Get dashboard stats.
 */
export async function getDashboardStats() {
    const [
        totalOrders,
        pendingOrders,
        paidOrders,
        processingOrders,
        shippedOrders,
        totalUsers,
        totalProducts,
        totalRevenue,
    ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PAID' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'SHIPPED' } }),
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        }),
    ]);

    return {
        orders: { total: totalOrders, pending: pendingOrders, paid: paidOrders, processing: processingOrders, shipped: shippedOrders },
        totalUsers,
        totalProducts,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
}
