/**
 * Job Processor — routes incoming jobs to appropriate handlers.
 *
 * Supports local in-memory queue (dev) and SQS (production).
 * Jobs are routed by `type` field.
 */

import { renderPrintFile } from './handlers/renderPrintFile.js';
import { sendOrderNotification } from './handlers/sendNotification.js';

const JOB_HANDLERS = {
    RENDER_PRINT: renderPrintFile,
    SEND_NOTIFICATION: sendOrderNotification,
};

/**
 * Process a single job by routing to the appropriate handler.
 */
export async function processJob(job) {
    const handler = JOB_HANDLERS[job.type];

    if (!handler) {
        console.error(`[Processor] Unknown job type: ${job.type}`);
        return;
    }

    console.log(`[Processor] Processing ${job.type} (${job.id || 'local'})`);
    const start = Date.now();

    try {
        const result = await handler(job.payload);
        const duration = Date.now() - start;
        console.log(`[Processor] ✅ ${job.type} completed in ${duration}ms`);
        return result;
    } catch (err) {
        const duration = Date.now() - start;
        console.error(`[Processor] ❌ ${job.type} failed after ${duration}ms:`, err.message);
        throw err;
    }
}

/**
 * Start the job processor — polls the queue and processes jobs.
 * For local dev, listens to EventEmitter events.
 * For SQS, long-polls the queue.
 */
export async function startProcessor(queue) {
    console.log('[Processor] Starting job processor...');

    if (queue.on) {
        // Local queue — event-driven
        queue.on('job', async (job) => {
            try {
                await processJob(job);
                await queue.ack(job.id);
            } catch (err) {
                await queue.nack(job, err);
            }
        });

        // Also process any jobs already in the queue
        let pending = await queue.poll();
        while (pending) {
            try {
                await processJob(pending);
                await queue.ack(pending.id);
            } catch (err) {
                await queue.nack(pending, err);
            }
            pending = await queue.poll();
        }
    } else {
        // SQS — long-polling loop
        while (true) {
            try {
                const job = await queue.poll();
                if (job) {
                    try {
                        await processJob(job);
                        await queue.ack(job.id, job.receiptHandle);
                    } catch (err) {
                        console.error(`[Processor] Job failed, will be retried:`, err.message);
                    }
                }
            } catch (err) {
                console.error('[Processor] Poll error:', err.message);
                await new Promise((r) => setTimeout(r, 5000)); // Back off on error
            }
        }
    }
}
