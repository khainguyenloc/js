const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all decks for user
router.get('/', async (req, res) => {
    try {
        const [decks] = await pool.query(`
            SELECT d.*, COUNT(f.id) as card_count 
            FROM decks d 
            LEFT JOIN flashcards f ON d.id = f.deck_id 
            WHERE d.user_id = ? 
            GROUP BY d.id
            ORDER BY d.created_at DESC
        `, [req.user.id]);
        
        res.json({ status: 'success', data: decks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

// Create deck
router.post('/', async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên bộ thẻ là bắt buộc' });

    try {
        const [result] = await pool.query(
            'INSERT INTO decks (user_id, name, description) VALUES (?, ?, ?)',
            [req.user.id, name, description || '']
        );
        res.status(201).json({ 
            status: 'success', 
            data: { id: result.insertId, user_id: req.user.id, name, description, card_count: 0 } 
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

// Update deck
router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    try {
        await pool.query('UPDATE decks SET name = ?, description = ? WHERE id = ? AND user_id = ?', 
            [name, description, req.params.id, req.user.id]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

// Delete deck
router.delete('/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM decks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

module.exports = router;
