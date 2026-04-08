const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Middleware kiểm tra quyền sở hữu bộ thẻ
const checkDeckOwnership = async (req, res, next) => {
    const deckIdRaw = req.body.deck_id || req.query.deck_id || req.params.id || req.params.deck_id;
    if (!deckIdRaw) return next();
    
    const deckId = parseInt(deckIdRaw, 10);
    if (isNaN(deckId)) {
        return res.status(400).json({ status: 'error', message: 'deck_id phải là số' });
    }
    
    try {
        const [decks] = await pool.query('SELECT user_id FROM decks WHERE id = ?', [deckId]);
        
        if (decks.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Không tìm thấy bộ thẻ' });
        }
        
        // ✅ FIX BUG: MySQL2 trả về BigInt, JWT trả về Number
        // Phải ép về Number() trước khi so sánh, không dùng !== trực tiếp
        const ownerIdFromDB  = Number(decks[0].user_id);
        const currentUserId  = Number(req.user.id);
        
        console.log(`[checkDeckOwnership] deck.user_id=${ownerIdFromDB}, req.user.id=${currentUserId}`);
        
        if (ownerIdFromDB !== currentUserId) {
            return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập vào bộ thẻ này' });
        }
        
        next();
    } catch (err) {
        console.error('[checkDeckOwnership] Lỗi SQL:', err.message);
        return res.status(500).json({ status: 'error', message: 'Lỗi máy chủ khi kiểm tra quyền' });
    }
};


// GET flashcards theo deck_id - kiểm tra quyền trực tiếp trong SQL, không dùng middleware
router.get('/', async (req, res) => {
    const deck_id = parseInt(req.query.deck_id, 10);
    
    if (!deck_id || isNaN(deck_id)) {
        return res.status(400).json({ status: 'error', message: 'Thiếu deck_id hợp lệ' });
    }

    try {
        console.log(`[GET /flashcards] deck_id=${deck_id}, user=${req.user.id}`);
        
        // Kiểm tra deck có thuộc về user hiện tại không (1 query duy nhất)
        const [decks] = await pool.query(
            'SELECT id FROM decks WHERE id = ? AND user_id = ?',
            [deck_id, req.user.id]
        );
        
        if (decks.length === 0) {
            return res.status(403).json({ status: 'error', message: 'Không có quyền xem bộ thẻ này' });
        }
        
        // Lấy tất cả flashcard của deck đó
        const [cards] = await pool.query(
            'SELECT * FROM flashcards WHERE deck_id = ? ORDER BY id DESC',
            [deck_id]
        );
        
        console.log(`[GET /flashcards] Found ${cards.length} cards`);
        res.json({ status: 'success', data: cards });
        
    } catch (err) {
        console.error('[GET /flashcards] Error:', err.message);
        res.status(500).json({ status: 'error', message: 'Lỗi server: ' + err.message });
    }
});


// POST thêm flashcard mới
router.post('/', checkDeckOwnership, async (req, res) => {
    const { deck_id, question, answer, media_url, type, options } = req.body;
    
    console.log('[POST /flashcards] body:', { deck_id, question, answer });
    
    if (!deck_id || !question || !answer) {
        return res.status(400).json({ status: 'error', message: 'Thiếu trường bắt buộc: deck_id, question, answer' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO flashcards (deck_id, question, answer, media_url, type, options) VALUES (?, ?, ?, ?, ?, ?)',
            [parseInt(deck_id, 10), question, answer, media_url || null, type || 'basic', options ? JSON.stringify(options) : null]
        );
        console.log(`[POST /flashcards] Inserted id=${result.insertId}`);
        res.status(201).json({
            status: 'success',
            data: { id: result.insertId, deck_id: parseInt(deck_id, 10), question, answer, media_url: media_url || null }
        });
    } catch (err) {
        console.error('[POST /flashcards] SQL Error:', err.message);
        res.status(500).json({ status: 'error', message: 'Lỗi SQL khi thêm thẻ' });
    }
});

// POST thêm flashcard hàng loạt (Bulk Add)
router.post('/bulk', checkDeckOwnership, async (req, res) => {
    const { deck_id, cards } = req.body;
    
    console.log('[POST /flashcards/bulk] body:', { deck_id, cards_count: cards?.length });
    
    if (!deck_id || !Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({ status: 'error', message: 'Thiếu deck_id hoặc mảng cards rỗng' });
    }

    try {
        const values = cards.map(card => [
            parseInt(deck_id, 10),
            card.front, // map front -> question
            card.back,  // map back -> answer
            null,       // media_url
            'basic',    // type
            null        // options
        ]);

        const [result] = await pool.query(
            'INSERT INTO flashcards (deck_id, question, answer, media_url, type, options) VALUES ?',
            [values]
        );
        
        console.log(`[POST /flashcards/bulk] Đã thêm ${result.affectedRows} thẻ`);
        res.status(201).json({
            status: 'success',
            message: `Đã thêm thành công ${result.affectedRows} thẻ`
        });
    } catch (err) {
        console.error('[POST /flashcards/bulk] SQL Error:', err.message);
        res.status(500).json({ status: 'error', message: 'Lỗi SQL khi thêm thẻ hàng loạt' });
    }
});

router.put('/:id', async (req, res) => {
    const { question, answer, media_url, type, options } = req.body;
    try {
        await pool.query(
            'UPDATE flashcards SET question = ?, answer = ?, media_url = ?, type = ?, options = ? WHERE id = ?',
            [question, answer, media_url || null, type || 'basic', options ? JSON.stringify(options) : null, req.params.id]
        );
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM flashcards WHERE id = ?', [req.params.id]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

module.exports = router;
