const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// رفع حد الحجم المستلم لاستيعاب ملفات الصور المرسلة كـ Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// تأمين البروتوكولات وحماية الواجهات
app.use(helmet({
    contentSecurityPolicy: false // تافه لعدم حجب الخطوط الخارجية والأيقونات
}));
app.use(cors());

// توجيه الخادم لقراءة الملفات الثابتة لواجهة الموقع (إن وُجدت)
app.use(express.static(path.join(__dirname, 'public')));

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// التأكد من وجود ملفات تخزين البيانات لعدم حدوث كراش
if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ systemLocked: false }, null, 2));
}

// --- المسارات الأساسية لعرض صفحات HTML من المجلد الرئيسي ---

// عرض الصفحة الرئيسية للموقع
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// عرض لوحة تحكم الإدارة
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// --------------------------------------------------------

// ١. فحص حالة استقبال الطلبات للموقع
app.get('/api/system-state', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        res.json({ success: true, systemLocked: config.systemLocked });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خَطَأٌ فِي قِرَاءَةِ الْإِعْدَادَاتِ' });
    }
});

// ٢. التحقق من صلاحية دخول الإدارة
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Athaar2026';
    
    if (password === adminPassword) {
        return res.json({ success: true, message: 'تَمَّ التَّحَقُّقُ بِنَجَاحٍ' });
    }
    res.status(401).json({ success: false, message: 'كَلِمَةُ السِّرِّ خَاطِئَةٌ!' });
});

// ٣. استقبال طلبات العملاء وحفظها
app.post('/api/send', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        if (config.systemLocked) {
            return res.status(403).json({ success: false, message: 'النِّظَامُ مُغْلَقٌ حَالِيّاً لِلصِّيَانَةِ' });
        }

        const { name, email, phone, service, idea, paymentMode, ref, finalDue, receiptFileBase64, receiptFileName } = req.body;

        if (!name || !email || !phone || !service) {
            return res.status(400).json({ success: false, message: 'الْحُقُولُ الرَّئِيسِيَّةُ مَطْلُوبَةٌ' });
        }

        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        
        const newOrder = {
            id: Date.now(),
            name,
            email,
            phone,
            service,
            idea,
            paymentMode,
            ref: ref || 'حَجْزُ مَقْعَدٍ مِبْدَئِيٍّ',
            finalDue,
            receiptFile: receiptFileBase64 ? { base64: receiptFileBase64, name: receiptFileName } : null,
            date: new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' })
        };

        orders.push(newOrder);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));

        res.json({ success: true, message: 'تَمَّ إِرْسَالُ طَلَبِكَ بِنَجَاحٍ دَاخِلَ النِّظَامِ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'حَدَثَ خَطَأٌ دَاخِلِيٌّ فِي السِّيرْفَرِ' });
    }
});

// ٤. جلب البيانات إلى لوحة التحكم (محمي بكلمة السر)
app.post('/api/admin/data', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Athaar2026';

    if (password !== adminPassword) {
        return res.status(403).json({ success: false, message: 'غَيْرُ مُصَرَّحٍ بِالدُّخُولِ' });
    }

    try {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        res.json({ success: true, orders, systemLocked: config.systemLocked });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خَطَأٌ فِي جَلْبِ الْبَيَانَاتِ' });
    }
});

// ٥. تعديل حالة النظام (قفل/فتح الاستقبال)
app.post('/api/admin/toggle-lock', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'Athaar2026';

    if (password !== adminPassword) {
        return res.status(403).json({ success: false, message: 'غَيْرُ مُصَرَّحٍ بِالتَّعْدِيلِ' });
    }

    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        config.systemLocked = !config.systemLocked;
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        res.json({ success: true, systemLocked: config.systemLocked });
    } catch (error) {
        res.status(500).json({ success: false, message: 'فَشَلَ تَحْدِيثُ حَالَةِ النِّظَامِ' });
    }
});

app.listen(PORT, () => {
    console.log(`[Athaar Server Launched Securely On Port: ${PORT}]`);
});

