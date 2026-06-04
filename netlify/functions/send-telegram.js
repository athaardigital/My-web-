const https = require('https');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { chatId, message } = JSON.parse(event.body);
    const token = process.env.TELEGRAM_BOT_TOKEN;

    return new Promise((resolve, reject) => {
        const path = `/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
        const req = https.request({
            hostname: 'api.telegram.org',
            path: path,
            method: 'GET'
        }, (res) => {
            resolve({ statusCode: 200, body: 'Message sent successfully' });
        });

        req.on('error', (e) => reject({ statusCode: 500, body: e.message }));
        req.end();
    });
};

