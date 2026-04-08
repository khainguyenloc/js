const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'c:/Users/nguye/js/backend/.env' });

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('No API key found in .env');
        return;
    }
    console.log('Testing API key starting with:', apiKey.substring(0, 5));
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        console.log('API RESPONSE SUCCESS:', response.text());
    } catch (err) {
        console.error('API TEST FAILED:', err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
