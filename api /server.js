const express = require('express');
const cors = require('cors');
const FormData = require('form-data');
const path = require('path'); // تمت إضافة هذه المكتبة للتعامل مع مسارات الملفات

const app = express();

// تفعيل ميزة CORS للسماح لواجهة موقعكِ بإرسال الطلبات للسيرفر بدون قيود
app.use(cors());

// جلب البيانات بصيغة JSON ورفع الحد الأقصى لحجم البيانات لاستيعاب صور الإيصالات
app.use(express.json({ limit: '10mb' }));

// --- الإضافة الجديدة: جعل السيرفر يعرض الملفات الثابتة (Index.html) ---
// بما أن server.js داخل مجلد api، نستخدم '../' للرجوع للمجلد الرئيسي حيث يوجد Index.html
app.use(express.static(path.join(__dirname, '../')));

app.post('/api/send', async (req, res) => {
    try {
        const { name, email, phone, service, idea, paymentMode, ref, finalDue, receiptFileBase64, receiptFileName } = req.body;

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ success: false, message: 'إعدادات البوت السريّة غير مكتملة في السيرفر.' });
        }

        const requestTime = new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' });

        const caption = `🌟 طَلَبٌ جَدِيدٌ | آثَار الرَّقْمِيَّة 🌟\n` +
            `⏱️ الوَقْت: ${requestTime}\n` +
            `──────────────────\n` +
            `👤 الاسْم: ${name || 'غير محدد'}\n` +
            `📧 البَرِيد: ${email || 'غير محدد'}\n` +
            `📱 الهَاتِف: ${phone || 'غير محدد'}\n` +
            `──────────────────\n` +
            `💼 الخِدْمَة: ${service || 'غير محدد'}\n` +
            `💡 الفِكْرَة: ${idea || 'لا يوجد'}\n` +
            `──────────────────\n` +
            `💳 طَرِيقَة الدَّفْع: ${paymentMode || 'غير محدد'}\n` +
            `🧾 رَقْم المَرْجِع: ${ref || 'لا يوجد'}\n` +
            `💰 المَبْلَغ المُسْتَحَق: ${finalDue || 'غير محدد'}`;

        if (receiptFileBase64) {
            const base64Data = receiptFileBase64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const form = new FormData();
            form.append('chat_id', CHAT_ID);
            form.append('caption', caption);

            let endpoint = 'sendPhoto';
            let fieldName = 'photo';

            // التحقق إذا كان المرفق PDF
            if (receiptFileName && receiptFileName.toLowerCase().endsWith('.pdf')) {
                endpoint = 'sendDocument';
                fieldName = 'document';
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

        // في حال عدم وجود مرفق
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
});

// --- توجيه أي مسار آخر غير الـ API ليقوم بفتح موقعك (Index.html) ---
// ملاحظة: نظام Render حساس لحالة الأحرف، لذا كتبنا Index.html بحرف كبير كما هو في ملفاتك
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
