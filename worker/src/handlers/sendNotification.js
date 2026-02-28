/**
 * Notification Handler — sends email and SMS notifications.
 *
 * Production: Uses AWS SES for emails and Twilio for SMS.
 * Local dev: Logs notifications to console.
 */

const USE_SES = !!process.env.AWS_SES_FROM_EMAIL;
const USE_TWILIO = !!(process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN);

/**
 * Send an email notification.
 * @param {object} params - { to, subject, html, text }
 */
export async function sendEmail({ to, subject, html, text }) {
    if (!USE_SES) {
        // Local dev — log to console
        console.log(`[Email] TO: ${to}`);
        console.log(`[Email] SUBJECT: ${subject}`);
        console.log(`[Email] BODY: ${text || html?.slice(0, 200)}`);
        console.log('[Email] (Local dev — not actually sent)');
        return { messageId: `local_email_${Date.now()}`, sent: false };
    }

    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    const ses = new SESClient({ region: process.env.AWS_REGION || 'ap-south-1' });

    const result = await ses.send(new SendEmailCommand({
        Source: process.env.AWS_SES_FROM_EMAIL,
        Destination: { ToAddresses: [to] },
        Message: {
            Subject: { Data: subject },
            Body: {
                ...(html && { Html: { Data: html } }),
                ...(text && { Text: { Data: text } }),
            },
        },
    }));

    console.log(`[Email] Sent to ${to}: ${result.MessageId}`);
    return { messageId: result.MessageId, sent: true };
}

/**
 * Send an SMS notification.
 * @param {object} params - { to, message }
 */
export async function sendSms({ to, message }) {
    if (!USE_TWILIO) {
        console.log(`[SMS] TO: ${to}`);
        console.log(`[SMS] MESSAGE: ${message}`);
        console.log('[SMS] (Local dev — not actually sent)');
        return { sid: `local_sms_${Date.now()}`, sent: false };
    }

    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

    const result = await client.messages.create({
        body: message,
        from: process.env.TWILIO_FROM_NUMBER,
        to,
    });

    console.log(`[SMS] Sent to ${to}: ${result.sid}`);
    return { sid: result.sid, sent: true };
}

/**
 * Send order notification based on event type.
 * @param {object} payload - { type, orderId, userId, email, phone? }
 */
export async function sendOrderNotification(payload) {
    const { type, orderId, email, phone } = payload;

    const templates = {
        ORDER_CONFIRMED: {
            subject: `PrintME — Order #${orderId.slice(-8)} Confirmed`,
            text: `Your order #${orderId.slice(-8)} has been confirmed and payment received. We'll start processing it right away!`,
        },
        ORDER_SHIPPED: {
            subject: `PrintME — Order #${orderId.slice(-8)} Shipped!`,
            text: `Your order #${orderId.slice(-8)} has been shipped. Track your delivery in your account.`,
        },
        ORDER_DELIVERED: {
            subject: `PrintME — Order #${orderId.slice(-8)} Delivered`,
            text: `Your order #${orderId.slice(-8)} has been delivered. Enjoy your custom prints!`,
        },
        ORDER_REFUNDED: {
            subject: `PrintME — Order #${orderId.slice(-8)} Refunded`,
            text: `Your order #${orderId.slice(-8)} has been refunded. The amount will appear in your account within 5-7 business days.`,
        },
    };

    const template = templates[type];
    if (!template) {
        console.log(`[Notification] Unknown notification type: ${type}`);
        return;
    }

    // Send email
    if (email) {
        await sendEmail({ to: email, ...template });
    }

    // Send SMS (if phone number available)
    if (phone) {
        await sendSms({ to: phone, message: template.text });
    }
}
