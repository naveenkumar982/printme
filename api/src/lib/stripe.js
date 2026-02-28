/**
 * Stripe Integration Library for PrintME.
 *
 * Wraps Stripe SDK operations for payment intent creation,
 * webhook signature verification, and refunds.
 *
 * Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env.
 * For local dev without Stripe, operations return mock data.
 */

const USE_STRIPE = !!process.env.STRIPE_SECRET_KEY;
let stripe = null;

/**
 * Lazily initialize Stripe SDK.
 */
async function getStripe() {
    if (stripe) return stripe;

    const Stripe = (await import('stripe')).default;
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia',
    });
    return stripe;
}

/**
 * Create a Stripe PaymentIntent.
 * @param {number} amount - Amount in smallest currency unit (paise for INR)
 * @param {string} currency - Currency code (default: 'inr')
 * @param {object} metadata - Order metadata (orderId, userId)
 * @returns {{ clientSecret: string, paymentIntentId: string }}
 */
export async function createPaymentIntent(amount, currency = 'inr', metadata = {}) {
    if (!USE_STRIPE) {
        // Mock for local dev
        const mockId = `pi_mock_${Date.now()}`;
        return {
            clientSecret: `${mockId}_secret_mock`,
            paymentIntentId: mockId,
        };
    }

    const s = await getStripe();
    const paymentIntent = await s.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert rupees to paise
        currency,
        metadata,
        automatic_payment_methods: { enabled: true },
    });

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
    };
}

/**
 * Verify Stripe webhook signature.
 * @param {Buffer} rawBody - Raw request body
 * @param {string} signature - Stripe-Signature header
 * @returns {object} - Parsed Stripe event
 */
export async function verifyWebhookSignature(rawBody, signature) {
    if (!USE_STRIPE) {
        // Mock for local dev — parse body directly
        return JSON.parse(rawBody.toString());
    }

    const s = await getStripe();
    return s.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );
}

/**
 * Create a refund for a payment.
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {{ refundId: string }}
 */
export async function createRefund(paymentIntentId) {
    if (!USE_STRIPE) {
        return { refundId: `re_mock_${Date.now()}` };
    }

    const s = await getStripe();
    const refund = await s.refunds.create({
        payment_intent: paymentIntentId,
    });

    return { refundId: refund.id };
}
