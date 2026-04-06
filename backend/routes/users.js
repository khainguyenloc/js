const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

router.get('/profile', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, xp, streak, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        
        const user = users[0];
        
        // Compute level (e.g. 100 XP per level)
        const level = Math.floor(user.xp / 100) + 1;
        
        // Determine today's study stats
        const today = new Date().toISOString().split('T')[0];
        const [sessions] = await pool.query('SELECT * FROM study_sessions WHERE user_id = ? ORDER BY date DESC LIMIT 7', [req.user.id]);
        
        let todayStats = { cards_reviewed: 0, correct_count: 0, xp_earned: 0 };
        if (sessions.length > 0 && new Date(sessions[0].date).toISOString().split('T')[0] === today) {
            todayStats = sessions[0];
        }

        res.json({
            status: 'success',
            data: {
                ...user,
                level,
                today_stats: todayStats,
                recent_activity: sessions
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error' });
    }
});

module.exports = router;
