const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

function formatInterval(days) {
   if (days === 0) return '< 1d';
   if (days === 1) return '1d';
   if (days < 30) return `${days}d`;
   if (days < 365) return `${Math.round(days / 30)}mo`;
   return `${Math.round(days / 365)}y`;
}

function calculateNextIntervals(ease, interval_days) {
    ease = ease || 2.5;
    interval_days = interval_days || 0;
    
    let again_int = 0;
    let hard_int = Math.max(1, Math.round(interval_days * 1.2));
    let good_int = Math.max(1, Math.round((interval_days === 0 ? 1 : interval_days) * ease));
    let ease_easy = ease + 0.15;
    let easy_int = Math.max(1, Math.round((interval_days === 0 ? 1 : interval_days) * ease_easy * 1.3));
    
    return {
        again: formatInterval(again_int),
        hard: formatInterval(hard_int),
        good: formatInterval(good_int),
        easy: formatInterval(easy_int)
    };
}

// Get cards out for review (either new ones without review, or due ones)
router.get('/', async (req, res) => {
    const force = req.query.force;
    const deck_id = parseInt(req.query.deck_id, 10);
    if (!deck_id || isNaN(deck_id)) return res.status(400).json({ message: 'deck_id is required' });

    try {
        let condition = "f.deck_id = ? AND (r.id IS NULL OR r.next_review_date <= CURDATE())";
        if (force === 'true') {
            condition = "f.deck_id = ?";
        }

        const [cards] = await pool.query(`
            SELECT f.*, r.ease, r.interval_days, r.next_review_date
            FROM flashcards f
            LEFT JOIN reviews r ON f.id = r.card_id AND r.user_id = ?
            WHERE ${condition}
            ORDER BY RAND()
            LIMIT 50
        `, [req.user.id, deck_id]);

        const cardsWithIntervals = cards.map(c => ({
            ...c,
            btn_intervals: calculateNextIntervals(c.ease, c.interval_days)
        }));

        res.json({ status: 'success', data: cardsWithIntervals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
});

// Update review progress on a card based on Space Repetition logic
router.post('/review', async (req, res) => {
    const { card_id, quality } = req.body; // quality: again, hard, good, easy
    const user_id = req.user.id;

    if (!['again', 'hard', 'good', 'easy'].includes(quality)) {
        return res.status(400).json({ message: 'Invalid quality' });
    }

    try {
        const [existing] = await pool.query('SELECT * FROM reviews WHERE user_id = ? AND card_id = ?', [user_id, card_id]);
        
        let ease = 2.5;
        let interval_days = 0;
        let review_count = 0;

        if (existing.length > 0) {
            ease = existing[0].ease;
            interval_days = existing[0].interval_days || 1;
            review_count = existing[0].review_count;
        }

        // SM-2 logic simplified
        review_count += 1;
        if (quality === 'again') {
            ease = Math.max(1.3, ease - 0.2);
            interval_days = 0;
        } else if (quality === 'hard') {
            ease = Math.max(1.3, ease - 0.15);
            interval_days = Math.max(1, Math.round(interval_days * 1.2));
        } else if (quality === 'good') {
            interval_days = Math.max(1, Math.round((interval_days === 0 ? 1 : interval_days) * ease));
        } else if (quality === 'easy') {
            ease += 0.15;
            interval_days = Math.max(1, Math.round((interval_days === 0 ? 1 : interval_days) * ease * 1.3));
        }

        // Calculate next review date
        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval_days);
        const formattedDate = nextReviewDate.toISOString().split('T')[0];

        if (existing.length > 0) {
            await pool.query(
                'UPDATE reviews SET ease = ?, interval_days = ?, next_review_date = ?, review_count = ? WHERE id = ?',
                [ease, interval_days, formattedDate, review_count, existing[0].id]
            );
        } else {
            await pool.query(
                'INSERT INTO reviews (user_id, card_id, ease, interval_days, next_review_date, review_count) VALUES (?, ?, ?, ?, ?, ?)',
                [user_id, card_id, ease, interval_days, formattedDate, review_count]
            );
        }
        
        // Log study session for Gamification
        const today = new Date().toISOString().split('T')[0];
        const [session] = await pool.query('SELECT * FROM study_sessions WHERE user_id = ? AND date = ?', [user_id, today]);
        const xpEarned = quality === 'again' || quality === 'hard' ? 5 : 15;
        const isCorrect = quality !== 'again' ? 1 : 0;
        
        if (session.length > 0) {
            await pool.query('UPDATE study_sessions SET cards_reviewed = cards_reviewed + 1, correct_count = correct_count + ?, xp_earned = xp_earned + ? WHERE id = ?', [isCorrect, xpEarned, session[0].id]);
        } else {
            // First card of the day -> Might trigger streak logic later
            await pool.query('INSERT INTO study_sessions (user_id, date, cards_reviewed, correct_count, xp_earned) VALUES (?, ?, 1, ?, ?)', [user_id, today, isCorrect, xpEarned]);
        }
        
        // Update user total XP
        await pool.query('UPDATE users SET xp = xp + ? WHERE id = ?', [xpEarned, user_id]);

        res.json({ status: 'success', next_review_date: formattedDate, xp_earned: xpEarned });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
});

module.exports = router;
