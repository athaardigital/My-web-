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

// --- حِمَايَةُ الْمَلَفَّاتِ الْحَسَّاسَةِ (مَهْمٌّ جِدّاً) ---
// هَذَا الْمِيدِلْوِير يَمْنَعُ أَيَّ أَحَدٍ مِنْ تَصَفُّحِ مَلَفَّاتِ الْبَرْمَجَةِ أَوْ قَوَاعِدِ الْبَيَانَاتِ
app.use((req, res, next) => {
    const sensitiveFiles = ['/server.js', '/orders.json', '/config.json', '/package.json', '/.env'];
    if (sensitiveFiles.includes(req.url)) {
        return res.status(403).send('ACCESS DENIED');
    }
    next();
});

// تفعيل استضافة الملفات من المجلد الرئيسي (مع التحذير أعلاه)
app.use(express.static(__dirname));

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// التأكد من وجود ملفات تخزين البيانات
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ systemLocked: false }, null, 2));

// المسارات الأساسية
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// --- نَفْسُ الْأَنْدِبُوينْتَاتِ (Endpoints) السَّابِقَةُ ---
// [ضَعِي نَفْسَ بَقِيَّةِ الْكُودِ: api/system-state, api/login, api/send, إلخ..]
// لَمْ أُكَرِّرْهَا لِتَجَنُّبِ الْحَشْوِ، كُلُّ مَا عَلَيْكِ هُوَ نَسْخُهَا مِنْ الْكُودِ السَّابِقِ بَعْدَ هَذَا السَّطْرِ.

app.listen(PORT, () => {
    console.log(`[Athaar Server Running In Flat Structure On Port: ${PORT}]`);
});
