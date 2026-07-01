const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// --- حِمَايَةُ الْمَلَفَّاتِ الْحَسَّاسَةِ ---
app.use((req, res, next) => {
    const sensitiveFiles = ['/server.js', '/orders.json', '/config.json', '/package.json', '/.env'];
    if (sensitiveFiles.includes(req.url)) {
        return res.status(403).send('ACCESS DENIED');
    }
    next();
});

// تفعيل استضافة الملفات من المجلد الرئيسي
app.use(express.static(__dirname));

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// التأكد من وجود ملفات تخزين البيانات
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ systemLocked: false }, null, 2));

// دالة مساعدة لقراءة الإعدادات
const getConfig = () => {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
        return { systemLocked: false };
    }
};

// دالة مساعدة لحفظ الإعدادات
const saveConfig = (config) => {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
};

// دالة مساعدة لقراءة الطلبات
const getOrders = () => {
    try {
        return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    } catch (e) {
        return [];
    }
};

// دالة مساعدة لحفظ الطلبات
const saveOrders = (orders) => {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
};

// المسارات الأساسية للواجهات
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// --- الأنبوينتات والمسارات البرمجية (API Endpoints) ---

// 1. جلب حالة الخادم (هل استقبال الطلبات مقفل أم مفتوح)
app.get('/api/system-state', (req, res) => {
    const config = getConfig();
    res.json({ success: true, systemLocked: config.systemLocked });
});

// 2. تسجيل دخول المسؤول للوحة التحكم
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // يمكنك تغيير كلمة المرور الافتراضية هنا أو عبر ملف .env
    
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true, token: password });
    } else {
        return res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }
});

// 3. جلب البيانات والطلبات للوحة التحكم (محمي بكلمة السر)
app.post('/api/admin/data', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: 'غير مصرح بالدخول' });
    }
    
    const orders = getOrders();
    const config = getConfig();
    res.json({ success: true, orders, systemLocked: config.systemLocked });
});

// 4. قفل أو فتح نظام استقبال الطلبات
app.post('/api/admin/toggle-lock', (req, res) => {
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, message: 'غير مصرح بالدخول' });
    }
    
    const config = getConfig();
    config.systemLocked = !config.systemLocked;
    saveConfig(config);
    
    res.json({ success: true, systemLocked: config.systemLocked });
});

// 5. استقبال وإرسال طلب جديد من العميل
app.post('/api/send', (req, res) => {
    const config = getConfig();
    
    // التحقق أولاً إذا كان النظام مقفلاً
    if (config.systemLocked) {
        return res.status(400).json({ success: false, message: 'نأسف، استقبال الطلبات مغلق حالياً.' });
    }
    
    const orderData = req.body;
    
    // التحقق من الحقول الأساسية
    if (!orderData.name || !orderData.service) {
        return res.status(400).json({ success: false, message: 'الرجاء ملء الحقول الأساسية الاسم والخدمة.' });
    }
    
    const orders = getOrders();
    
    // بناء كائن الطلب وتوثيق الوقت والتاريخ بشكل منظم
    const newOrder = {
        id: Date.now().toString(),
        name: orderData.name,
        email: orderData.email || '',
        phone: orderData.phone || '',
        service: orderData.service,
        idea: orderData.idea || '',
        receiptFileBase64: orderData.receiptFileBase64 || null,
        receiptFileName: orderData.receiptFileName || null,
        date: new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Algiers' })
    };
    
    orders.push(newOrder);
    saveOrders(orders);
    
    res.json({ success: true, message: 'تم إرسال طلبك بنجاح وسنقوم بمراجعته.' });
});

app.listen(PORT, () => {
    console.log(`[Athaar Server Running In Flat Structure On Port: ${PORT}]`);
});
