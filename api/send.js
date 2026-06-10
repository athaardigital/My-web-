// api/send.js

export default async function handler(req, res) {
    // إعدادات الأمان والسماح بالاتصال (CORS) لأي اختبار محلي
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // التعامل مع طلبات التحقق المسبق للمتصفحات
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // قبول طلبات الإرسال POST فقط
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'المسار يدعم طلبات POST فقط' });
    }

    try {
        // استقبال بيانات العميل القادمة من استمارة موقع آثار
        const { name, email, phone, service, idea, paymentMode, ref, finalDue } = req.body;

        // صياغة رسالة تليجرام الاحترافية والمميزة التي اعتمدناها سابقاً
        const telegramMessage = `🌟 طلب خدمة جديد من آثار الرقمية 🌟\n` +
            `──────────────────\n` +
            `👤 الاسم الكامل: ${name || 'غير محدد'}\n` +
            `📧 البريد الإلكتروني: ${email || 'غير محدد'}\n` +
            `📞 رقم الهاتف: ${phone || 'غير محدد'}\n` +
            `🛠️ نوع الخدمة: ${service ? service.toUpperCase() : 'غير محدد'}\n` +
            `💡 تفاصيل المشروع: ${idea || 'لا يوجد'}\n` +
            `💳 نمط السداد المختار: ${paymentMode === "seat" ? "حجز مقعد وتأمين البدء" : "كامل المبلغ النهائي"}\n` +
            `🔢 الرقم المرجعي / الحوالة: ${ref || 'لا يوجد'}\n` +
            `💰 الإجمالي المقبوض: ${finalDue || '0'}\n` +
            `──────────────────`;

        // جلب الأسرار الأمنية للبوت والـ Chat ID من بيئة عمل Vercel الآمنة
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ success: false, message: 'إعدادات البوت السريّة غير مكتملة في السيرفر.' });
        }

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        // إرسال البيانات مباشرة إلى سيرفرات تليجرام بسرعة فائقة وضمان 100%
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: telegramMessage
            })
        });

        const data = await response.json();

        if (data.ok) {
            return res.status(200).json({ success: true, message: 'تم إرسال طلبك بنجاح زاهر!' });
        } else {
            return res.status(400).json({ success: false, message: data.description });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'حدث خطأ داخلي في السيرفر: ' + error.message });
    }
}
