
import https from 'https';

const API_KEY = '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';
const MODEL = 'deepseek/deepseek-r1-0528:free'; // The one in the code

const data = JSON.stringify({
    model: MODEL,
    messages: [{ role: 'user', content: 'Say hello' }]
});

const options = {
    hostname: 'openrouter.ai',
    path: '/api/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Test Script'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
