const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// ============================================================
// GEMINI AI INTEGRATION
// Để dùng AI thật: thêm GEMINI_API_KEY=... vào file .env
// Lấy key miễn phí tại: https://aistudio.google.com/app/apikey
// ============================================================

// Kết hợp model + apiVersion để thử tất cả khả năng
const MODEL_CONFIGS = [
    { model: 'gemini-2.0-flash-lite', apiVersion: 'v1beta' },
    { model: 'gemini-1.5-flash-8b',   apiVersion: 'v1beta' },
    { model: 'gemini-1.5-flash',       apiVersion: 'v1beta' },
    { model: 'gemini-1.5-flash',       apiVersion: 'v1'     }, // Thử v1 endpoint
    { model: 'gemini-1.0-pro',         apiVersion: 'v1'     }, // Model cũ hơn, quota rộng hơn
    { model: 'gemini-1.0-pro',         apiVersion: 'v1beta' },
];

let apiKey = null;
let GoogleGenerativeAIClass = null;

if (process.env.GEMINI_API_KEY) {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        GoogleGenerativeAIClass = GoogleGenerativeAI;
        apiKey = process.env.GEMINI_API_KEY;
        console.log('[AI] ✅ Gemini API key đã được nạp - sẵn sàng kết nối!');
    } catch (err) {
        console.warn('[AI] ⚠️ Không thể load package @google/generative-ai:', err.message);
    }
} else {
    console.log('[AI] ℹ️ Chạy ở chế độ Smart Mock (chưa có GEMINI_API_KEY)');
}


// ============================================================
// Hàm xây dựng Prompt gửi cho Gemini
// ============================================================
function buildPrompt(word, meaning, action, message) {
    const systemRole = `Bạn là một gia sư tiếng Anh thông minh, thân thiện và chuyên nghiệp. 
Bạn đang hỗ trợ học sinh học từ vựng tiếng Anh qua ứng dụng Flashcard.
Từ vựng hiện tại học sinh đang học là: "${word}" (nghĩa: ${meaning || 'chưa rõ'}).
Trả lời ngắn gọn, súc tích bằng tiếng Việt, dùng emoji khi phù hợp.`;

    const actionPrompts = {
        explain: `Hãy giải thích chi tiết từ "${word}": nghĩa, từ loại, cách dùng, và 1 mẹo ghi nhớ sáng tạo.`,
        examples: `Hãy đặt 3 câu ví dụ thực tế với từ "${word}", kèm bản dịch tiếng Việt cho mỗi câu.`,
        synonyms: `Hãy liệt kê 4-5 từ đồng nghĩa với "${word}", kèm giải thích ngắn điểm khác biệt giữa chúng.`,
        chat: message || `Hỏi thêm về từ "${word}"`,
    };

    const userQuestion = actionPrompts[action] || message || `Hỏi về từ "${word}"`;
    return `${systemRole}\n\nYêu cầu của học sinh: ${userQuestion}`;
}

// ============================================================
// Dynamic Mock - Fallback khi không có Gemini API Key
// ============================================================
function getDynamicMockReply(word, meaning, action, message) {
    const w = word || 'từ này';
    const m = meaning || '...';

    if (action === 'explain') {
        return `🎓 **Giải thích từ "${w}":**

📌 **Nghĩa:** ${m}

💡 **Mẹo ghi nhớ:** Hãy tạo một câu chuyện ngắn trong đầu có chứa từ **"${w}"** - não bộ ghi nhớ câu chuyện tốt hơn từ đơn lẻ!

📖 **Cách dùng:** Từ "${w}" thường được dùng trong các ngữ cảnh giao tiếp hàng ngày và văn viết.

*(Kết nối Gemini API để có giải thích chi tiết hơn!)*`;
    }

    if (action === 'examples') {
        return `📝 **3 câu ví dụ với "${w}":**

1️⃣ The word **${w}** is very important in English.
   → Từ **${w}** rất quan trọng trong tiếng Anh.

2️⃣ Can you use **${w}** in a sentence?
   → Bạn có thể dùng **${w}** trong một câu không?

3️⃣ Learning **${w}** will help you improve your vocabulary.
   → Học **${w}** sẽ giúp bạn cải thiện vốn từ vựng.

*(Kết nối Gemini API để có ví dụ phong phú hơn!)*`;
    }

    if (action === 'synonyms') {
        return `🔄 **Từ đồng nghĩa với "${w}":**

• **Similar word 1** - gần nghĩa, dùng trong văn nói
• **Similar word 2** - trang trọng hơn, dùng trong văn viết  
• **Similar word 3** - thông dụng trong tiếng Anh Mỹ
• **Similar word 4** - dùng trong ngữ cảnh học thuật

💪 Học hết cụm từ đồng nghĩa này, IELTS 8.0 không còn xa! 🔥

*(Kết nối Gemini API để có danh sách từ thực tế!)*`;
    }

    // Câu hỏi tự do
    const msg = (message || '').toLowerCase();
    
    if (msg.includes('chào') || msg.includes('hello') || msg.includes('hi') || msg.includes('xin chào')) {
        return `👋 Chào bạn! Mình là AI Tutor, rất vui được hỗ trợ bạn học từ **"${w}"** hôm nay!

Bạn muốn mình **giải thích** từ này, **lấy ví dụ câu**, hay **tìm từ đồng nghĩa** không? 😊`;
    }
    if (msg.includes('cảm ơn') || msg.includes('thanks') || msg.includes('thank you')) {
        return `😊 Không có gì bạn ơi! Mình rất vui khi được hỗ trợ bạn học từ **"${w}"**.

Chúc bạn học tốt và nhớ lâu nhé! 💪🔥`;
    }
    if (msg.includes('khó') || msg.includes('không hiểu') || msg.includes('confus') || msg.includes('khó nhớ')) {
        return `🤔 À, từ **"${w}"** hơi tricky đúng không? Đừng lo!

💡 **Mẹo:** Thay vì cố học thuộc lòng, hãy thử đặt một câu dùng từ này về chủ đề bạn yêu thích (như game, phim, food...). Nhấn **"Giải thích"** để mình phân tích chi tiết hơn nhé!`;
    }
    if (msg.includes('ví dụ') || msg.includes('example') || msg.includes('câu')) {
        return `📝 Tất nhiên! Nhấn nút **"Lấy 3 ví dụ câu"** bên dưới để mình tạo ví dụ thực tế cho từ **"${w}"** ngay nhé! 🚀`;
    }
    if (msg.includes('nghĩa') || msg.includes('mean') || msg.includes('là gì') || msg.includes('dịch')) {
        return `📖 Từ **"${w}"** có nghĩa là **"${m}"** trong tiếng Việt.

Nhấn **"Giải thích"** để mình phân tích chi tiết hơn về cách dùng và mẹo ghi nhớ nhé! 🎓`;
    }

    // Câu hỏi ngoài phạm vi tiếng Anh
    return `🎓 Mình là AI Tutor chuyên hỗ trợ học tiếng Anh!

Hiện tại bạn đang học từ **"${w}"** (${m}). Mình có thể giúp bạn:
• 📖 **Giải thích** nghĩa và cách dùng
• 📝 **Lấy 3 ví dụ** câu thực tế  
• 🔄 **Tìm từ đồng nghĩa**

Dùng các nút bên dưới để bắt đầu nhé! 😊`;
}

// ============================================================
// POST /api/ai/chat
// ============================================================
router.post('/chat', async (req, res) => {
    const { word, context, message, action } = req.body;

    console.log(`[AI /chat] word="${word}", action="${action}"`);

    try {
        let reply;

        if (GoogleGenerativeAIClass && apiKey) {
            // ✅ Thử từng cặp model + apiVersion
            const prompt = buildPrompt(word, context, action, message);

            for (const { model: modelName, apiVersion } of MODEL_CONFIGS) {
                try {
                    console.log(`[AI] Thử: ${modelName} (${apiVersion})...`);
                    const genAI = new GoogleGenerativeAIClass(apiKey, { apiVersion });
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    reply = result.response.text();
                    console.log(`[AI] ✅ Thành công: ${modelName} (${apiVersion})`);
                    break;
                } catch (modelErr) {
                    const errMsg = modelErr.message || '';
                    console.warn(`[AI] ✕ ${modelName} (${apiVersion}): ${errMsg.slice(0, 60)}`);
                    // Tiếp tục nếu lỗi quota hoặc not found
                    if (errMsg.includes('429') || errMsg.includes('404') || 
                        errMsg.includes('quota') || errMsg.includes('not found') ||
                        errMsg.includes('RESOURCE_EXHAUSTED')) {
                        continue;
                    }
                    break; // Lỗi khác thì dừng
                }
            }

            if (!reply) {
                console.warn('[AI] Tất cả model đều hết quota → Smart Mock');
                reply = getDynamicMockReply(word, context, action, message);
            }
        } else {
            // Smart Mock khi chưa có API key
            await new Promise(resolve => setTimeout(resolve, 600));
            reply = getDynamicMockReply(word, context, action, message);
        }

        res.json({ status: 'success', reply });

    } catch (err) {
        console.error('[AI] Lỗi:', err.message);
        res.json({ status: 'success', reply: getDynamicMockReply(word, context, action, message) });
    }
});

module.exports = router;

