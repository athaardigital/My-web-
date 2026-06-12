module.exports = async (req, res) => {
    // إعدادات الأمان والسماح بالاتصال
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
        const { name, email, phone, service, idea, paymentMode, ref, finalDue, receiptFileBase64, receiptFileName } = req.body;

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ success: false, message: 'إعدادات البوت السريّة غير مكتملة في السيرفر.' });
        }

        // صياغة رسالة تليجرام
        const caption = `🌟 طلب خدمة جديد من آثار الرقمية 🌟\n` +
            `──────────────────\n` +
            `👤 الاسم: ${name || 'غير محدد'}\n` +
            `📧 البريد: ${email || 'غير محدد'}\n` +
            `📞 الهاتف: ${phone || 'غير محدد'}\n` +
            `🛠️ الخدمة: ${service || 'غير محدد'}\n` +
            `💡 تفاصيل المشروع: ${idea || 'لا يوجد تفاصيل'}\n` +
            `💳 الدفع: ${paymentMode === "seat" ? "حجز مقعد" : "تأكيد الدفع والاستلام"}\n` +
            `🔢 المرجعي: ${ref || 'لا يوجد'}\n` +
            `💰 الإجمالي: ${finalDue || '0'}\n` +
            `──────────────────`;

        // معالجة المرفقات إن وجدت
        if (receiptFileBase64) {
            const matches = receiptFileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            
            if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const base64Data = matches[2];
                
                // تحويل Base64 إلى Buffer ليقبله تليجرام
                const buffer = Buffer.from(base64Data, 'base64');

                // نستخدم FormData لإرسال الملف
                // ملاحظة: في بيئة Serverless، قد نحتاج لاستخدام مكتبة مثل 'form-data' أو إرسال الـ buffer مباشرة
                // الحل الأبسط المعتمد هنا هو استخدام fetch مع البناء اليدوي للـ FormData
                const FormData = require('form-data');
                const form = new FormData();
                form.append('chat_id', CHAT_ID);
                form.append('caption', caption);
                
                let endpoint = 'sendDocument';
                let fieldName = 'document';
                if (mimeType.startsWith('image/')) {
                    endpoint = 'sendPhoto';
                    fieldName = 'photo';
                }
                
                form.append(fieldName, buffer, { filename: receiptFileName || 'receipt.png' });

                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
                    method: 'POST',
                    body: form
                });
                
                const data = await response.json();
                if(data.ok) {
                    return res.status(200).json({ success: true, message: 'تم إرسال الطلب مع المرفق بنجاح!' });
                } else {
                    return res.status(400).json({ success: false, message: data.description });
                }
            }
        }

        // إرسال رسالة نصية إذا لم يوجد مرفق
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: caption
            })
        });

        const data = await response.json();
        if (data.ok) {
            return res.status(200).json({ success: true, message: 'تم إرسال الطلب بنجاح!' });
        } else {
            return res.status(400).json({ success: false, message: data.description });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'خطأ داخلي: ' + error.message });
    }
};
