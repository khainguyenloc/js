const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Chúng ta sẽ nạp dotenv thủ công từ file tuyệt đối để đảm bảo chính xác 100%
const envPath = path.join(__dirname, '../.env');

router.use(authMiddleware);

// ============================================================
// GEMINI AI CONFIGURATION
// ============================================================
let GoogleGenerativeAI;
try {
    GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
} catch (e) {
    console.error('[AI] ✕ SDK @google/generative-ai chưa được cài đặt!');
}

function getActionableMockReply(word, meaning, action, errorCode, errorMessage = "") {
    const w = word || 'từ này';
    const m = meaning || '...';
    
    let warningMsg = "";
    if (errorCode === 403) {
        warningMsg = `\n\n> ⚠️ **Lỗi Quyền truy cập (403):** API Key của bạn chưa được bật "Generative Language API". Hãy truy cập [Google AI Studio](https://aistudio.google.com/app/apikey) để kiểm tra và Enable dịch vụ này. (Chi tiết: ${errorMessage})`;
    } else if (errorCode === 429) {
        warningMsg = `\n\n> ⚠️ **Hết Hạn mức (429):** Tài khoản của bạn đã hết quota miễn phí cho hôm nay. Vui lòng thử lại sau vài phút.`;
    } else if (errorCode === 'MISSING_KEY') {
        warningMsg = `\n\n> ℹ️ **Kiểm tra file .env:** Hệ thống không tìm thấy GEMINI_API_KEY. Hãy đảm bảo bạn đã dán Key và RESTART server backend.`;
    } else {
        warningMsg = `\n\n> ℹ️ **Trạng thái:** AI đang bận (Error: ${errorCode}). Đây là nội dung mẫu.`;
    }

    const replies = {
        explain: `🎓 **Giải thích từ "${w}":**\n📌 **Nghĩa:** ${m}\n💡 **Mẹo ghi nhớ:** Hãy gắn từ **"${w}"** với một hình ảnh hoặc âm thanh tương tự để não bộ dễ dàng liên tưởng. Học qua hình ảnh giúp nhớ lâu hơn gấp 5 lần so với chỉ học chữ.\n📖 **Cách dùng:** Thường dùng trong các ngữ cảnh học thuật và giao tiếp hàng ngày.${warningMsg}`,
        examples: `📝 **3 câu ví dụ với "${w}":**\n1️⃣ Using **${w}** effectively is a key skill.\n2️⃣ I found this **${w}** very helpful for my exam.\n3️⃣ Can you explain the **${w}** of this sentence?${warningMsg}`,
        synonyms: `🔄 **Từ đồng nghĩa với "${w}":**\n• **Option 1** - Dùng phổ thông.\n• **Option 2** - Dùng trang trọng.\n• **Option 3** - Thành ngữ liên quan.${warningMsg}`,
        default: `👋 Chào bạn! Tôi là AI Tutor. Hiện tại tôi đang chạy ở chế độ dự phòng (${errorCode}). Tôi vẫn có thể giúp bạn giải nghĩa cơ bản cho từ **"${w}"** đấy!${warningMsg}`
    };

    return replies[action] || replies.default;
}

// ============================================================
// POST /api/ai/chat
// ============================================================
router.post('/chat', async (req, res) => {
    // Ép nạp lại biến môi trường trước khi chạy (Đảm bảo lấy Key mới nhất)
    require('dotenv').config({ path: envPath });
    
    const API_KEY = process.env.GEMINI_API_KEY;
    const { word, context, message, action } = req.body;
    
    if (!API_KEY || !GoogleGenerativeAI) {
        return res.json({ 
            status: 'success', 
            reply: getActionableMockReply(word, context, action, 'MISSING_KEY') 
        });
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemRole = `Bạn là Gia sư Tiếng Anh AI chuyên nghiệp. Hỗ trợ học tập từ "${word}" (Nghĩa: ${context || 'Chưa rõ'}). Trả lời súc tích bằng Tiếng Việt.`;
        let promptText = "";
        if (action === 'explain') promptText = `Giải thích từ "${word}": Nghĩa, cách dùng, mẹo nhớ.`;
        else if (action === 'examples') promptText = `3 câu ví dụ cho "${word}" kèm dịch.`;
        else if (action === 'synonyms') promptText = `Từ đồng nghĩa với "${word}".`;
        else promptText = message || `Hỏi về "${word}"`;

        const result = await model.generateContent(`${systemRole}\n\nYêu cầu: ${promptText}`);
        const response = await result.response;
        res.json({ status: 'success', reply: response.text() });

    } catch (err) {
        console.error('[AI Error]', err.message);
        let errorCode = 500;
        if (err.message.includes('403')) errorCode = 403;
        else if (err.message.includes('429')) errorCode = 429;
        
        res.json({ status: 'success', reply: getActionableMockReply(word, context, action, errorCode, err.message) });
    }
});

module.exports = router;
