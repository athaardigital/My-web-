require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// إتاحة قراءة الملفات من المجلد الرئيسي
app.use(express.static(__dirname));

// الاتصال بقاعدة بيانات MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/athaar";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected successfully to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// هيكل الطلبات السحابية
const OrderSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    service: String,
    idea: String,
    paymentMode: String,
    ref: String,
    finalDue: String,
    requestTime: String,
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// هيكل المشاريع السحابية
const ProjectSchema = new mongoose.Schema({
    titleAr: String,
    titleEn: String,
    link: String,
    createdAt: { type: Date, default: Date.now }
});
const Project = mongoose.model('Project', ProjectSchema);

// وسيط آمن لحماية لوحة التحكم
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ success: false, message: 'غير مسموح بالدخول، التوكن مفقود.' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'ATHAAR_SECRET_KEY', (err, decoded) => {
        if (err) return res.status(401).json({ success: false, message: 'جلسة غير صالحة أو منتهية.' });
        req.admin = decoded;
        next();
    });
};

// تسجيل الدخول للإدارة
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'ATHAAR_SECRET_KEY', { expiresIn: '24h' });
        return res.status(200).json({ success: true, token, message: 'دُخُولٌ نَاجِحٌ' });
    } else {
        return res.status(401).json({ success: false, message: 'كَلِمَةُ سِرٍّ خَاطِئَةٌ' });
    }
});

// استقبال طلبات المستخدمين وحفظها سحابياً وإرسالها للتليجرام
app.post('/api/send', async (req, res) => {
    try {
        const { name, email, phone, service, idea, paymentMode, ref, finalDue, receiptFileBase64, receiptFileName } = req.body;
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(500).json({ success: false, message: 'إِعْدَادَاتُ الْبُوتِ غَيْرُ مُكْتَمِلَةٍ.' });
        }

        const requestTime = new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' });

        const newOrder = new Order({ name, email, phone, service, idea, paymentMode, ref, finalDue, requestTime });
        await newOrder.save();

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

            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, { method: 'POST', body: form });
            const data = await response.json();
            if(data.ok) return res.status(200).json({ success: true, message: 'تَمَّتِ الْعَمَلِيَّةُ بِنَجَاحٍ.' });
        }

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: caption })
        });
        const data = await response.json();
        if (data.ok) return res.status(200).json({ success: true, message: 'تَمَّ الإِرْسَالُ!' });
        return res.status(400).json({ success: false, message: data.description });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
});

// جلب المشاريع للعامة
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, projects });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// إضافة مشروع جديد
app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    try {
        const { titleAr, titleEn, link } = req.body;
        const newProject = new Project({ titleAr, titleEn, link });
        await newProject.save();
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// حذف مشروع
app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// جلب الطلبات للمسؤول
app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, orders });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// التوجيه الصارم والمستقر للوحة التحكم لمنع مشاكل الوصول الاستاتيكي
app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'admin.html'));
});

// التوجيه الافتراضي لباقي المسارات
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'Index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server optimized on port ${PORT}`));
