require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// 1. الاتصال بقاعدة بيانات MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/athaar";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected successfully to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

// 2. تعريف نماذج البيانات (Schemas)
const OrderSchema = new mongoose.Schema({
    name: String, email: String, phone: String, service: String,
    idea: String, paymentMode: String, ref: String, finalDue: String,
    requestTime: { type: String, default: () => new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' }) }
});
const Order = mongoose.model('Order', OrderSchema);

const IdeaSchema = new mongoose.Schema({ text: String, createdAt: { type: Date, default: Date.now } });
const Idea = mongoose.model('Idea', IdeaSchema);

const ProjectSchema = new mongoose.Schema({ title: String, desc: String, media: String, createdAt: { type: Date, default: Date.now } });
const Project = mongoose.model('Project', ProjectSchema);

const SettingSchema = new mongoose.Schema({ key: String, value: mongoose.Schema.Types.Mixed });
const Setting = mongoose.model('Setting', SettingSchema);

// وسيط التحقق من الهوية والأمان عبر التوكن (JWT Middleware)
const verifyAdmin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ success: false, message: 'غير مسموح بالدخول، التوكن مفقود.' });
    
    jwt.verify(token, process.env.JWT_SECRET || 'ATHAAR_SECRET_KEY', (err, decoded) => {
        if (err) return res.status(401).json({ success: false, message: 'جلسة غير صالحة أو منتهية.' });
        req.admin = decoded;
        next();
    });
};

// 3. نقاط الاتصال (API Endpoints)

// تسجيل الدخول وإصدار التوكن الآمن
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'ATHAAR_SECRET_KEY', { expiresIn: '24h' });
        return res.status(200).json({ success: true, token, message: 'دُخُولٌ نَاجِحٌ' });
    } else {
        return res.status(401).json({ success: false, message: 'كَلِمَةُ سِرٍّ خَاطِئَةٌ' });
    }
});

// استقبال الطلبات من العملاء وحفظها + إرسالها لتليجرام
app.post('/api/send', async (req, res) => {
    try {
        const { name, email, phone, service, idea, paymentMode, ref, finalDue, receiptFileBase64, receiptFileName } = req.body;

        // التحقق من صحة البيانات الأساسية (Server-side Validation)
        if (!name || !phone || !service) {
            return res.status(400).json({ success: false, message: 'يرجى ملء الحقول الإلزامية الأساسية.' });
        }

        // التحقق من حالة النظام (هل الاستقبال مفتوح؟)
        const systemStatus = await Setting.findOne({ key: 'system_closed' });
        if (systemStatus && systemStatus.value === true) {
            return res.status(403).json({ success: false, message: 'نعتذر، استقبال الطلبات مغلق حالياً.' });
        }

        // حفظ الطلب في قاعدة البيانات MongoDB أولاً لضمان عدم ضياعه
        const newOrder = new Order({ name, email, phone, service, idea, paymentMode, ref, finalDue });
        await newOrder.save();

        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!BOT_TOKEN || !CHAT_ID) {
            return res.status(200).json({ success: true, message: 'تم حفظ الطلب بنجاح في قاعدة البيانات (إعدادات البوت غير مكتملة).' });
        }

        const requestTime = new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' });
        const caption = `🌟 طَلَبٌ جَدِيدٌ | آثَار الرَّقْمِيَّة 🌟\n⏱️ الوَقْت: ${requestTime}\n──────────────────\n👤 الاسْم: ${name || 'غَيْرُ مُحَدَّدٍ'}\n📧 البَرِيد: ${email || 'غَيْرُ مُحَدَّدٍ'}\n📱 الهَاتِف: ${phone || 'غَيْرُ مُحَدَّدٍ'}\n──────────────────\n💼 الخِدْمَة: ${service || 'غَيْرُ مُحَدَّدٍ'}\n💡 الفِكْرَة: ${idea || 'لَا يُوجَدُ'}\n──────────────────\n💳 طَرِيقَة الدَّفْع: ${paymentMode || 'غَيْرُ مُحَدَّدٍ'}\n🧾 رَقْم المَرْجِع: ${ref || 'لَا يُوجَدُ'}\n💰 المَبْلَغ المُسْتَحَق: ${finalDue || 'غَيْرُ مُحَدَّدٍ'}`;

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

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, { method: 'POST', body: form });
        } else {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: CHAT_ID, text: caption })
            });
        }

        return res.status(200).json({ success: true, message: 'تَمَّ إِرْسَالُ وَحِفْظُ الطَّلَبِ بِنَجَاحٍ!' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'خَطَأٌ دَاخِلِيٌّ: ' + error.message });
    }
});

// لوحة التحكم - جلب الإحصائيات والطلبات (محمي بـ JWT)
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const latestOrder = await Order.findOne().sort({ _index: -1 });
        const systemStatus = await Setting.findOne({ key: 'system_closed' });
        
        return res.json({
            success: true,
            totalOrders,
            lastService: latestOrder ? latestOrder.service : 'لا يوجد طلبات بعد',
            systemClosed: systemStatus ? systemStatus.value : false
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// لوحة التحكم - إدارة الأفكار السريعة (محمي)
app.get('/api/admin/ideas', async (req, res) => {
    const ideas = await Idea.find().sort({ createdAt: -1 });
    res.json({ success: true, data: ideas });
});

app.post('/api/admin/ideas', verifyAdmin, async (req, res) => {
    const { text } = req.body;
    const newIdea = new Idea({ text });
    await newIdea.save();
    res.json({ success: true });
});

// لوحة التحكم - إدارة المشاريع المعروضة (محمي)
app.get('/api/admin/projects', async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
});

app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    const { title, desc, media } = req.body;
    const newProj = new Project({ title, desc, media });
    await newProj.save();
    res.json({ success: true });
});

// لوحة التحكم - التحكم بحالة استقبال الطلبات (محمي)
app.post('/api/admin/toggle-system', verifyAdmin, async (req, res) => {
    let status = await Setting.findOne({ key: 'system_closed' });
    if (!status) {
        status = new Setting({ key: 'system_closed', value: true });
    } else {
        status.value = !status.value;
    }
    await status.save();
    res.json({ success: true, systemClosed: status.value });
}
);

app.get('/api/system-status', async (req, res) => {
    const status = await Setting.findOne({ key: 'system_closed' });
    res.json({ systemClosed: status ? status.value : false });
});

// 4. التوجيه ومسارات الصفحات
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
