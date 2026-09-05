/**
 * Notification adapter.
 *
 * This is a clean reconnection point for the external Telegram (and,
 * formerly, email) notification setup described by the project owner —
 * it is NOT reverse-engineered or guessed. Nothing here invents a bot
 * token, chat ID, or API detail.
 *
 * Behavior:
 *   - If TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are both present in the
 *     environment, a message is sent via the Telegram Bot API.
 *   - If they are absent, this silently no-ops. It never throws, never
 *     blocks order submission, and never logs secret values.
 *
 * To reconnect the real setup: set TELEGRAM_BOT_TOKEN and
 * TELEGRAM_CHAT_ID as environment variables on the host (Render →
 * Environment). If the previously-working setup used different variable
 * names, rename the two constants below to match — nothing else needs
 * to change.
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || null;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || null;

function formatOrderMessage(order) {
    const lines = [
        'طلب جديد — وشيج',
        `الاسم: ${order.name}`,
        `الخدمة: ${order.service}`,
        order.phone ? `الهاتف: ${order.phone}` : null,
        order.email ? `البريد: ${order.email}` : null,
        order.finalDue ? `الإجمالي التقديري: ${order.finalDue}` : null,
        `الحالة: قيد المراجعة`
    ].filter(Boolean);
    return lines.join('\n');
}

async function notifyNewOrder(order) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.log('[notify] Telegram not configured (TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID unset) — skipping.');
        return { sent: false, reason: 'not_configured' };
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: formatOrderMessage(order)
            })
        });
        if (!res.ok) {
            console.error('[notify] Telegram API responded with an error status:', res.status);
            return { sent: false, reason: 'api_error' };
        }
        return { sent: true };
    } catch (err) {
        // Never let a notification failure break order submission.
        console.error('[notify] Failed to reach Telegram API:', err.message);
        return { sent: false, reason: 'network_error' };
    }
}

module.exports = { notifyNewOrder };

