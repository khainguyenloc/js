const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Middleware to check if deck belongs to user
const checkDeckOwnership = async (req, res, next) => {
    const deckId = req.body.deck_id || req.query.deck_id;
    if (!deckId) return next(); // Let validation handle it if it's missing
    
    const [decks] = await pool.query('SELECT user_id FROM decks WHERE id = ?', [deckId]);
    if (decks.length === 0 || decks[0].user_id !== req.user.id) {
        return res.status(403).json({ message: 'Không có quyền truy cập vào bộ thẻ này' });
    }
    next();
};

// Get flashcards for a specific deck
router.get('/', checkDeckOwnership, async (req, res) => {
    const { deck_id } = req.query;
    if (!deck_id) return res.status(400).json({ message: 'Required deck_id' });

    try {
        const [cards] = await pool.query('SELECT * FROM flashcards WHERE deck_id = ? ORDER BY created_at DESC', [deck_id]);
        res.json({ status: 'success', data: cards });
    } catch (err) {
        res.status(500).json({ status: 'error' });
    }
});

// Create flashcard
router.post('/', checkDeckOwnership, async (req, res) => {
    const { deck_id, question, answer, media_url, type, options } = req.body;
    if (!deck_id || !question || !answer) return res.status(400).json({ message: 'Missing fields' });

    try {
        const [result] = await pool.query(
            'INSERT INTO flashcards (deck_id, question, answer, media_url, type, options) VALUES (?, ?, ?, ?, ?, ?)',
            [deck_id, question, answer, media_url || null, type || 'basic', options ? JSON.stringify(options) : null]
        );
        res.status(201).json({ status: 'success', data: { id: result.insertId, deck_id, question, answer } });
    } catch (err) {
        res.status(500).json({ status: 'error' });
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
