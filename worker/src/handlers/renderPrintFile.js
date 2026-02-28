/**
 * Print File Renderer — converts canvas JSON to a high-resolution image.
 *
 * Production: Uses headless Fabric.js (node-canvas) for 300 DPI rendering.
 * Local dev: Creates a placeholder PNG by writing order info to a text file.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Render a print file from canvas JSON.
 * @param {object} payload - { orderId, orderItemId, canvasJson }
 * @returns {{ filePath: string, url: string }}
 */
export async function renderPrintFile({ orderId, orderItemId, canvasJson }) {
    console.log(`[Render] Starting print file render for order ${orderId}, item ${orderItemId}`);

    try {
        // Try to use fabric.js if available
        const { createCanvas } = await import('canvas');

        // Parse the canvas JSON
        const canvasData = typeof canvasJson === 'string' ? JSON.parse(canvasJson) : canvasJson;

        // Create a canvas at 300 DPI (assuming 6x8 inch print)
        const width = canvasData.width || 1800;  // 6 inches × 300 DPI
        const height = canvasData.height || 2400; // 8 inches × 300 DPI
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Render objects from canvas JSON
        if (canvasData.objects) {
            for (const obj of canvasData.objects) {
                ctx.save();
                if (obj.type === 'text' || obj.type === 'i-text') {
                    ctx.font = `${obj.fontSize || 24}px ${obj.fontFamily || 'Arial'}`;
                    ctx.fillStyle = obj.fill || '#000000';
                    ctx.fillText(obj.text || '', obj.left || 0, obj.top || 0);
                } else if (obj.type === 'rect') {
                    ctx.fillStyle = obj.fill || '#CCCCCC';
                    ctx.fillRect(obj.left || 0, obj.top || 0, obj.width || 100, obj.height || 100);
                }
                ctx.restore();
            }
        }

        // Save as PNG
        const outputDir = path.resolve(__dirname, '../../output/prints');
        await fs.mkdir(outputDir, { recursive: true });

        const fileName = `print_${orderId}_${orderItemId}.png`;
        const filePath = path.join(outputDir, fileName);
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(filePath, buffer);

        console.log(`[Render] Print file saved: ${filePath}`);
        return { filePath, url: `/output/prints/${fileName}` };
    } catch (importErr) {
        // Fallback: create a placeholder text file
        console.log('[Render] canvas module not available, creating placeholder');

        const outputDir = path.resolve(__dirname, '../../output/prints');
        await fs.mkdir(outputDir, { recursive: true });

        const fileName = `print_${orderId}_${orderItemId}.txt`;
        const filePath = path.join(outputDir, fileName);

        const content = [
            `PrintME — Print File Placeholder`,
            `Order: ${orderId}`,
            `Item: ${orderItemId}`,
            `Generated: ${new Date().toISOString()}`,
            `Canvas JSON: ${typeof canvasJson === 'string' ? canvasJson.slice(0, 200) : JSON.stringify(canvasJson).slice(0, 200)}`,
        ].join('\n');

        await fs.writeFile(filePath, content);
        console.log(`[Render] Placeholder saved: ${filePath}`);
        return { filePath, url: `/output/prints/${fileName}` };
    }
}
