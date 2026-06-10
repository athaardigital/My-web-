// api/send.js

export default async function handler(req, res) {
    // إعدادات الأمان والسماح بالاتصال (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'المسار يدعم طلبات POST فقط' });
    }

    try {
        // استقبال البيانات الشاملة بما فيها الإضافات وصورة الوصل الرقمية
        const { name, email, phone, service, addons, idea, paymentMode, ref, total, receiptFileBase64, receiptFileName } = req.body;

        // تنسيق الرسالة البرقية بشكل أنيق مدعوم بالـ HTML لضمان الأمان ضد الرموز الخاصة
        const telegramMessage = `<b>🔔 طلب خدمة جديد (آثار الرقمية)</b>\n` +
            `──────────────────\n` +
            `<b>👤 الاسم الكامل:</b> ${name || 'غير محدد'}\n` +
            `<b>📧 البريد الإلكتروني:</b> ${email || 'غير محدد'}\n` +
            `<b>📱 رقم الهاتف:</b> ${phone || 'غير محدد'}\n` +
            `<b>💼 نوع الخدمة:</b> ${service ? service.toUpperCase() : 'غير محدد'}\n` +
            `<b>🧩 الإضافات المختارة:</b> ${addons || 'بدون إضافات'}\n` +
            `<b>💡 تفاصيل المشروع:</b> ${idea || 'لا يوجد تفاصيل'}\n` +
            `<b>💳 نمط السداد المختار:</b> ${paymentMode || 'غير محدد'}\n` +
            `<b>🔢 الرقم المرجعي / الحوالة:</b> ${ref || 'لا يوجد'}\n` +
            `<b>💰 الإجمالي المقبوض:</b> ${total || '0'}\n` +
            `──────────────────`;

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ success: false, message: 'إعدادات البوت السرية غير مكتملة في سيرفر Vercel.' });
        }

        // إذا كان العميل قد أرفق صورة إيصال الدفع
        if (receiptFileBase64) {
            const base64Data = receiptFileBase64.split(',')[1];
            const mimeType = receiptFileBase64.split(',')[0].split(':')[1].split(';')[0];
            const buffer = Buffer.from(base64Data, 'base64');

            // بناء نموذج إرسال متعدد الأجزاء سحابياً بدون مكتبات خارجية
            const formData = new FormData();
            formData.append('chat_id', CHAT_ID);
            formData.append('caption', telegramMessage);
            formData.append('parse_mode', 'HTML');
            
            const blob = new Blob([buffer], { type: mimeType });
            formData.append('photo', blob, receiptFileName || 'receipt.jpg');

            const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
            const response = await fetch(telegramUrl, { method: 'POST', body: formData });
            const data = await response.json();

            if (data.ok) {
                return res.status(200).json({ success: true, message: 'تم إرسال طلبك مع صورة الوصل بنجاح!' });
            } else {
                return res.status(400).json({ success: false, message: data.description });
            }
        } else {
            // إذا كان الطلب نصياً فقط بدون إرفاق صورة
            const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
            const response = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();

            if (data.ok) {
                return res.status(200).json({ success: true, message: 'تم إرسال طلبك بنجاح زاهر!' });
            } else {
                return res.status(400).json({ success: false, message: data.description });
            }
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'حدث خطأ داخلي في السيرفر: ' + error.message });
    }
}
