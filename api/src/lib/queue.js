/**
 * Job Queue Library for PrintME.
 *
 * Production: Uses AWS SQS for reliable job delivery with DLQ.
 * Local dev: In-memory queue with retry logic.
 *
 * Every job has: { type, payload, retries }
 */

import { EventEmitter } from 'events';

const USE_SQS = !!(process.env.AWS_ACCESS_KEY_ID && process.env.SQS_QUEUE_URL);

// ── In-Memory Queue (Local Dev) ──

class LocalQueue extends EventEmitter {
    constructor() {
        super();
        this.jobs = [];
        this.processing = false;
        this.dlq = []; // Dead-letter queue
    }

    async enqueue(job) {
        const wrappedJob = {
            id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: job.type,
            payload: job.payload,
            retries: 0,
            maxRetries: job.maxRetries || 3,
            createdAt: new Date().toISOString(),
        };

        this.jobs.push(wrappedJob);
        console.log(`[Queue] Job enqueued: ${wrappedJob.type} (${wrappedJob.id})`);
        this.emit('job', wrappedJob);
        return wrappedJob;
    }

    async poll() {
        return this.jobs.shift() || null;
    }

    async ack(jobId) {
        console.log(`[Queue] Job acknowledged: ${jobId}`);
    }

    async nack(job, error) {
        if (job.retries >= job.maxRetries) {
            console.error(`[Queue] Job moved to DLQ after ${job.retries} retries: ${job.id}`);
            this.dlq.push({ ...job, error: error.message, failedAt: new Date().toISOString() });
            return;
        }

        job.retries++;
        console.log(`[Queue] Job retry ${job.retries}/${job.maxRetries}: ${job.id}`);
        this.jobs.push(job);
    }

    getDlq() {
        return [...this.dlq];
    }
}

// ── SQS Queue (Production) ──

class SqsQueue {
    constructor() {
        this.client = null;
        this.queueUrl = process.env.SQS_QUEUE_URL;
    }

    async getClient() {
        if (this.client) return this.client;
        const { SQSClient } = await import('@aws-sdk/client-sqs');
        this.client = new SQSClient({ region: process.env.AWS_REGION || 'ap-south-1' });
        return this.client;
    }

    async enqueue(job) {
        const { SendMessageCommand } = await import('@aws-sdk/client-sqs');
        const client = await this.getClient();

        const result = await client.send(new SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: JSON.stringify(job),
            MessageGroupId: job.type,
        }));

        console.log(`[SQS] Message sent: ${result.MessageId}`);
        return { id: result.MessageId, ...job };
    }

    async poll() {
        const { ReceiveMessageCommand } = await import('@aws-sdk/client-sqs');
        const client = await this.getClient();

        const result = await client.send(new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: 20, // Long polling
            VisibilityTimeout: 60,
        }));

        if (!result.Messages?.length) return null;

        const msg = result.Messages[0];
        const parsed = JSON.parse(msg.Body);
        return {
            id: msg.MessageId,
            receiptHandle: msg.ReceiptHandle,
            ...parsed,
        };
    }

    async ack(jobId, receiptHandle) {
        const { DeleteMessageCommand } = await import('@aws-sdk/client-sqs');
        const client = await this.getClient();

        await client.send(new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: receiptHandle,
        }));
    }
}

// ── Export singleton ──

const queue = USE_SQS ? new SqsQueue() : new LocalQueue();
export default queue;
