import { Router } from 'express';
import express from 'express';
import { verifyWebhookSignature } from '../../lib/stripe.js';
import { updateOrderStatus, deductStock } from '../orders/orders.service.js';

const router = Router();

/**
 * POST /api/payments/webhook
 *
 * Stripe sends payment events here.
 * IMPORTANT: Must use raw body (not JSON parsed) for signature verification.
 *
 * Handles:
 * - payment_intent.succeeded → Mark order as PAID, deduct stock
 * - payment_intent.payment_failed → Keep as PENDING (user can retry)
 */
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        try {
            const signature = req.headers['stripe-signature'];
            const event = await verifyWebhookSignature(req.body, signature);

            switch (event.type) {
                case 'payment_intent.succeeded': {
                    const pi = event.data.object;
                    const orderId = pi.metadata?.orderId;

                    if (orderId) {
                        try {
                            // Transition: PENDING → PAID
                            await updateOrderStatus(orderId, 'PAID', {
                                stripePaymentId: pi.id,
                            });

                            // Deduct stock
                            await deductStock(orderId);

                            console.log(`[Webhook] Payment succeeded for order ${orderId}`);
                        } catch (err) {
                            // Log but don't fail — Stripe will retry
                            console.error(`[Webhook] Failed to process order ${orderId}:`, err.message);
                        }
                    }
                    break;
                }

                case 'payment_intent.payment_failed': {
                    const pi = event.data.object;
                    const orderId = pi.metadata?.orderId;
                    console.log(`[Webhook] Payment failed for order ${orderId || 'unknown'}`);
                    break;
                }

                default:
                    console.log(`[Webhook] Unhandled event type: ${event.type}`);
            }

            // Always respond 200 to acknowledge receipt
            res.json({ received: true });
        } catch (err) {
            console.error('[Webhook] Error:', err.message);
            res.status(400).json({ error: 'Webhook verification failed' });
        }
    }
);

/**
 * POST /api/payments/create-intent
 *
 * Creates a Stripe PaymentIntent for a given order.
 * Called from the frontend after order creation.
 */
router.post('/create-intent', express.json(), async (req, res, next) => {
    try {
        // Must be called as a module import
        const { authenticate } = await import('../../middleware/authenticate.js');
        const { default: prisma } = await import('../../lib/prisma.js');
        const { createPaymentIntent } = await import('../../lib/stripe.js');

        // Inline auth check
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { verifyAccessToken } = await import('../../config/jwt.js');
        const decoded = verifyAccessToken(authHeader.split(' ')[1]);

        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ error: 'orderId is required' });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, userId: true, status: true, totalAmount: true, stripePaymentId: true },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.userId !== decoded.userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (order.status !== 'PENDING') {
            return res.status(400).json({ error: `Order is ${order.status}, not PENDING` });
        }

        // If already has a PaymentIntent, return existing
        if (order.stripePaymentId) {
            return res.json({
                message: 'PaymentIntent already exists',
                paymentIntentId: order.stripePaymentId,
            });
        }

        const { clientSecret, paymentIntentId } = await createPaymentIntent(
            Number(order.totalAmount),
            'inr',
            { orderId: order.id, userId: decoded.userId }
        );

        // Store PaymentIntent ID on order
        await prisma.order.update({
            where: { id: orderId },
            data: { stripePaymentId: paymentIntentId },
        });

        res.json({
            message: 'PaymentIntent created',
            clientSecret,
            paymentIntentId,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
