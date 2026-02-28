import 'dotenv/config';
import { startProcessor } from './jobProcessor.js';

// We use a shared queue instance
// In production, both API and Worker connect to the same SQS queue
// In local dev, we use an in-memory queue imported from the API lib
let queue;

async function boot() {
    console.log(`
  ╔══════════════════════════════════════╗
  ║    🔧 PrintME Worker v1.0.0         ║
  ║    Environment: ${process.env.NODE_ENV || 'development'}     ║
  ╚══════════════════════════════════════╝
  `);

    try {
        // Import queue (shared with API in local dev)
        const queueModule = await import('../../api/src/lib/queue.js');
        queue = queueModule.default;

        // Start processing jobs
        await startProcessor(queue);

        console.log('[Worker] Job processor started. Listening for jobs...');
    } catch (err) {
        console.error('[Worker] Failed to start:', err.message);
        console.log('[Worker] Running in standby mode — heartbeat every 60s');
    }

    // Heartbeat
    setInterval(() => {
        const dlqCount = queue?.getDlq?.()?.length || 0;
        console.log(`[Worker] Heartbeat — ${new Date().toISOString()} | DLQ: ${dlqCount}`);
    }, 60_000);
}

boot();

// Graceful shutdown
const shutdown = () => {
    console.log('\n[Worker] Shutting down gracefully...');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
