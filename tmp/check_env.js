require('dotenv').config({ path: 'c:/Users/nguye/js/backend/.env' });
console.log('PORT:', process.env.PORT);
console.log('API_KEY_EXISTS:', !!process.env.GEMINI_API_KEY);
console.log('API_KEY_START:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : 'NONE');
