<?php
// إعدادات البوت 
$botToken = "8544368853:AAEKWADoAH1K62zR4Tp1tO3rLfOI8Y0jZ8E";
$chatId = "7322325980";

// استقبال البيانات من الموقع
$name = $_POST['name'] ?? 'غير محدد';
$email = $_POST['email'] ?? 'غير محدد';
$phone = $_POST['phone'] ?? 'غير محدد';
$service = $_POST['service'] ?? 'غير محدد';
$addons = $_POST['addons'] ?? 'بدون إضافات';
$idea = $_POST['idea'] ?? 'لا يوجد تفاصيل';
$paymentMode = $_POST['paymentMode'] ?? 'غير محدد';
$ref = $_POST['ref'] ?? 'غير محدد';
$total = $_POST['total'] ?? '0';

// تنسيق الرسالة النصية
$message = "🔔 *طلب خدمة جديد (آثار الرقمية)*\n\n";
$message .= "👤 *الاسم:* $name\n";
$message .= "📧 *البريد:* $email\n";
$message .= "📱 *الهاتف:* $phone\n";
$message .= "💼 *الخدمة:* $service\n";
$message .= "🧩 *الإضافات:* $addons\n";
$message .= "💳 *نوع الدفع:* $paymentMode\n";
$message .= "🔢 *رقم الحوالة:* $ref\n";
$message .= "💰 *الإجمالي:* $total\n\n";
$message .= "💡 *التفاصيل:* \n$idea";

// دالة لإرسال الطلبات إلى تليجرام
function sendToTelegram($url, $postFields) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $result = curl_exec($ch);
    curl_close($ch);
    return $result;
}

// التأكد من وجود ملف (صورة وصل) مرفوع
if (isset($_FILES['receiptFile']) && $_FILES['receiptFile']['error'] === UPLOAD_ERR_OK) {
    // العميل رفع صورة، نرسل الصورة مع النص كـ Caption
    $fileTmpPath = $_FILES['receiptFile']['tmp_name'];
    $fileName = $_FILES['receiptFile']['name'];
    $fileType = $_FILES['receiptFile']['type'];
    
    // تجهيز الملف للإرسال
    $cFile = new CURLFile($fileTmpPath, $fileType, $fileName);
    $postFields = array(
        'chat_id' => $chatId,
        'document' => $cFile,
        'caption' => $message,
        'parse_mode' => 'Markdown'
    );
    
    $url = "https://api.telegram.org/bot$botToken/sendDocument";
    sendToTelegram($url, $postFields);

} else {
    // العميل لم يرفع صورة، نرسل رسالة نصية فقط
    $postFields = array(
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'Markdown'
    );
    
    $url = "https://api.telegram.org/bot$botToken/sendMessage";
    sendToTelegram($url, $postFields);
}

// إرجاع رد ناجح للموقع
echo json_encode(["status" => "success"]);
?>
