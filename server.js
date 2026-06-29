const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// جَعْلُ السِّيرْفَرِ يَقْرَأُ الْمِلَفَّاتِ مِنَ الْمُجَلَّدِ الرَّئِيسِيِّ مُبَاشَرَةً
app.use(express.static(__dirname));

// نُقْطَةُ اتِّصَالٍ آمِنَةٍ لِلتَّحَقُّقِ مِنْ كَلِمَةِ السِّرِّ عَبْرَ السِّيرْفَرِ
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        return res.status(200).json({ success: true, message: 'دُخُولٌ نَاجِحٌ' });
    } else {
        return res.status(401).json({ success: false, message: 'كَلِمَةُ سِرٍّ خَاطِئَةٌ' });
    }
});

app.post('/api/send', async (req, res) => {
    try {
        const { name, email, phone, service, idea, paymentMode, ref, finalDue, receiptFileBase64, receiptFileName } = req.body;

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ success: false, message: 'إِعْدَادَاتُ الْبُوتِ السِّرِّيَّةُ غَيْرُ مُكْتَمِلَةٍ فِي السِّيرْفَرِ.' });
        }

        const requestTime = new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' });

        const caption = `🌟 طَلَبٌ جَدِيدٌ | آثَار الرَّقْمِيَّة 🌟\n` +
            `⏱️ الوَقْت: ${requestTime}\n` +
            `──────────────────\n` +
            `👤 الاسْم: ${name || 'غَيْرُ مُحَدَّدٍ'}\n` +
            `📧 البَرِيد: ${email || 'غَيْرُ مُحَدَّدٍ'}\n` +
            `📱 الهَاتِف: ${phone || 'غَيْرُ مُحَدَّدٍ'}\n` +
            `──────────────────\n` +
            `💼 الخِدْمَة: ${service || 'غَيْرُ مُحَدَّدٍ'}\n` +
            `💡 الفِكْرَة: ${idea || 'لَا يُوجَدُ'}\n` +
            `──────────────────\n` +
            `💳 طَرِيقَة الدَّفْع: ${paymentMode || 'غَيْرُ مُحَدَّدٍ'}\n` +
            `🧾 رَقْم المَرْجِع: ${ref || 'لَا يُوجَدُ'}\n` +
            `💰 المَبْلَغ المُسْتَحَق: ${finalDue || 'غَيْرُ مُحَدَّدٍ'}`;

        if (receiptFileBase64) {
            const base64Data = receiptFileBase64.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            
            const blob = new Blob([buffer]);
            const form = new FormData();
            
            form.append('chat_id', CHAT_ID);
            form.append('caption', caption);

            let endpoint = 'sendPhoto';
            let fieldName = 'photo';

            if (receiptFileName && receiptFileName.toLowerCase().endsWith('.pdf')) {
                endpoint = 'sendDocument';
                fieldName = 'document';
            }

            form.append(fieldName, blob, receiptFileName || 'receipt.png');

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
                method: 'POST',
                body: form
            });
            
            const data = await response.json();
            if(data.ok) {
                return res.status(200).json({ success: true, message: 'تَمَّ إِرْسَالُ الطَّلَبِ مَعَ الْمُرْفَقِ بِنَجَاحٍ!' });
            } else {
                return res.status(400).json({ success: false, message: data.description });
            }
        }

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
            return res.status(200).json({ success: true, message: 'تَمَّ إِرْسَالُ الطَّلَبِ بِنَجَاحٍ!' });
        } else {
            return res.status(400).json({ success: false, message: data.description });
        }

    } catch (error) {
        return res.status(500).json({ success: false, message: 'خَطَأٌ دَاخِلِيٌّ: ' + error.message });
    }
});

// تَوْجِيهُ السِّيرْفَرِ لِفَتْحِ مِلَفِّ Index.html الْمُتَوَاجِدِ مَعَهُ فِي نَفْسِ الْمُجَلَّدِ الرَّئِيسِيِّ
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
