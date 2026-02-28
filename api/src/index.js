import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma.js';
import authRoutes from './modules/auth/auth.routes.js';
import catalogueRoutes from './modules/catalogue/catalogue.routes.js';
import designRoutes from './modules/designs/designs.routes.js';
import orderRoutes from './modules/orders/orders.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import addressRoutes from './modules/addresses/addresses.routes.js';
import wishlistRoutes from './modules/wishlist/wishlist.routes.js';
import reviewRoutes from './modules/reviews/reviews.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Health Check ──
app.get('/api/health', async (_req, res) => {
    try {
        await prisma.$queryRawUnsafe('SELECT 1');
        res.json({
            status: 'ok',
            service: 'printme-api',
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    } catch (err) {
        res.status(503).json({
            status: 'error',
            service: 'printme-api',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: err.message,
        });
    }
});

// ── Payment Webhook (raw body — must be before JSON parser) ──
app.use('/api/payments', paymentRoutes);

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/designs', designRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);



// ── Static uploads (local dev only) ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── 404 Handler ──
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server (only in non-serverless / local dev) ──
if (!process.env.VERCEL) {
    const server = app.listen(PORT, () => {
        console.log(`
  ╔══════════════════════════════════════╗
  ║    🖨️  PrintME API v1.0.0            ║
  ║    Running on port ${PORT}              ║
  ║    Environment: ${process.env.NODE_ENV || 'development'}     ║
  ╚══════════════════════════════════════╝
  `);
    });

    // Graceful shutdown
    const shutdown = async () => {
        console.log('\nShutting down gracefully...');
        await prisma.$disconnect();
        server.close(() => process.exit(0));
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

// Export for Vercel serverless
export default app;
