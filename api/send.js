// api/send.js

export default async function handler(req, res) {
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
            `${idea || 'لا يوجد تفاصيل'}\n` + // الـ idea هنا تحتوي مسبقاً على التفاصيل والإضافات من الواجهة
            `💳 الدفع: ${paymentMode === "seat" ? "حجز مقعد" : "كامل المبلغ"}\n` +
            `🔢 المرجعي: ${ref || 'لا يوجد'}\n` +
            `💰 الإجمالي: ${finalDue || '0'}\n` +
            `──────────────────`;

        // إذا قام العميل برفع ملف (صورة أو PDF)
        if (receiptFileBase64) {
            const matches = receiptFileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            
            if (matches && matches.length === 3) {
                const mimeType = matches[1];
                const buffer = Buffer.from(matches[2], 'base64');
                const blob = new Blob([buffer], { type: mimeType });

                const formData = new FormData();
                formData.append('chat_id', CHAT_ID);
                formData.append('caption', caption);
                
                // تحديد نوع الإرسال بناءً على الملف (صورة أو مستند)
                let endpoint = 'sendDocument';
                let fieldName = 'document';
                if (mimeType.startsWith('image/')) {
                    endpoint = 'sendPhoto';
                    fieldName = 'photo';
                }
                
                formData.append(fieldName, blob, receiptFileName || 'receipt.png');

                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if(data.ok) {
                    return res.status(200).json({ success: true, message: 'تم إرسال الطلب مع المرفق بنجاح!' });
                } else {
                    return res.status(400).json({ success: false, message: data.description });
                }
            }
        }

        // إذا لم يكن هناك ملف، أرسل رسالة نصية عادية
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
}
