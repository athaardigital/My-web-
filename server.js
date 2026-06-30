const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    console.error("خطأ فادح: لم يتم تعيين متغير البيئة JWT_SECRET الحساس بملف الـ .env!");
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

app.use(cors());
// رفع السعة بشكل دقيق ومدروس للسماح بمرور الـ Base64 الخاص بالإيصالات
app.use(express.json({ limit: '25mb' })); 
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(express.static(path.join(__dirname)));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/athaar_digital';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('تم الاتصال بقاعدة بيانات MongoDB بنجاح.'))
    .catch(err => console.error('خطأ في الاتصال بقاعدة البيانات:', err));

const OrderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    serviceType: { type: String, required: true },
    description: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    referenceNumber: { type: String },
    amount: { type: Number, required: true },
    receiptImage: { type: String }, 
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

        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: 'حدث خطأ أثناء معالجة تسجيل الدخول.' });
    }
});

app.post('/api/send', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json({ message: 'تم إرسال طلبك بنجاح!' });
    } catch (error) {
        console.error('خطأ في حفظ الطلب:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.' });
    }
});

app.get('/api/admin/orders', verifyAdmin, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'خطأ في جلب الطلبات.' });
    }
});

app.post('/api/admin/projects', verifyAdmin, async (req, res) => {
    try {
        const newProject = new Project(req.body);
        await newProject.save();
        res.status(201).json({ message: 'تم إضافة المشروع بنجاح إلى معرض الأعمال!' });
    } catch (error) {
        res.status(500).json({ message: 'خطأ في إضافة المشروع.' });
    }
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`السيرفر يعمل بكفاءة على المنفذ: http://localhost:${PORT}`);
});
