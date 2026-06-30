const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// التحقق الصارم من وجود مفاتيح البيئة الحساسة لضمان أمان النظام وحظر الثغرات
if (!process.env.JWT_SECRET) {
    console.error("خطأ فادح: لم يتم تعيين متغير البيئة JWT_SECRET الحساس بملف الـ .env!");
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// الإعدادات الوسيطة (Middleware)
app.use(cors());
app.use(express.json({ limit: '5mb' })); // تقليص حد الاستقبال لحماية السيرفر وقاعدة البيانات من التضخم
app.use(express.urlencoded({ limit: '5mb', extended: true }));
app.use(express.static(path.join(__dirname)));

// الاتصال بقاعدة البيانات MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/athaar_digital';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('تم الاتصال بقاعدة بيانات MongoDB بنجاح.'))
    .catch(err => console.error('خطأ في الاتصال بقاعدة البيانات:', err));

// مخطط نماذج البيانات (Mongoose Schemas & Models)
const OrderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    serviceType: { type: String, required: true },
    description: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    referenceNumber: { type: String },
    amount: { type: Number, required: true },
    receiptImage: { type: String }, // مخزن كـ Base64 (تم تقييد الحجم في الواجهة الأمامية)
    createdAt: { type: Date, default: Date.now }
});

const ProjectSchema = new mongoose.Schema({
    titleAr: { type: String, required: true },
    titleEn: { type: String, required: true },
    projectLink: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);
const Project = mongoose.model('Project', ProjectSchema);

// دالة التحقق الوسيطة للمسؤول (Admin Authentication Middleware)
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'وصول مرفوض: التوكن غير موجود!' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'وصول مرفوض: التوكن غير صالح أو منتهي الصلاحية!' });
        }
        req.user = user;
        next();
    });
};

// مسارات واجهات برمجية التطبيق (APIs Routes)

// 1. تسجيل دخول المسؤول بمقارنة الهاش المشفر الآمن بدلاً من النص المكشوف
app.post('/api/login', async (req, res) => {
    const { password } = req.body;
    const hashedPassword = process.env.ADMIN_PASSWORD_HASH;

    if (!hashedPassword) {
        return res.status(500).json({ message: 'خطأ داخلي: لم يتم ضبط الهاش المشفر للمسؤول بالسيرفر.' });
    }

    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'كلمة المرور غير صحيحة!' });
        }

        // توليد توكن JWT آمن وموقع صالح لمدة 24 ساعة
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: 'حدث خطأ أثناء معالجة تسجيل الدخول.' });
    }
});

// 2. استقبال طلبات العملاء الجديدة وحفظها في قاعدة البيانات
app.post('/api/send', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: 'تم إرسال طلبك بنجاح! سنقوم بمراجعته والتواصل معك قريباً.' });
    } catch (error) {
        console.error('خطأ في حفظ الطلب:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.' });
    }
});

// 3. جلب جميع طلبات العملاء (مسار محمي للمسؤولين فقط مرتب تنازلياً)
app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الطلبات.' });
    }
});

// 4. إضافة مشروع جديد لمعرض الأعمال (مسار محمي)
app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    try {
        const newProject = new Project(req.body);
        await newProject.save();
        res.status(201).json({ message: 'تم إضافة المشروع بنجاح إلى معرض الأعمال!' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة المشروع.' });
    }
});

// 5. حذف مشروع من معرض الأعمال نهائياً (مسار محمي)
app.delete('/api/admin/projects/:id', verifyAdmin, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'تم حذف المشروع بنجاح من المعرض!' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في حذف المشروع.' });
    }
});

// توجيه افتراضي لخدمة واجهة لوحة تحكم المسؤول
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// تشغيل خادم التطبيق
app.listen(PORT, () => {
    console.log(`السيرفر يعمل بكفاءة على المنفذ الاستمعاعي: http://localhost:${PORT}`);
});
