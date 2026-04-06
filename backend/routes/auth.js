const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Thiếu username hoặc password' });

    try {
        const [existingUser] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Username đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        
        res.status(201).json({ status: 'success', message: 'Đăng ký thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        const user = users[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ status: 'error', message: 'Sai tên đăng nhập hoặc mật khẩu' });
        }

        // Update last login
        await pool.query('UPDATE users SET last_login_date = CURDATE() WHERE id = ?', [user.id]);

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.json({ 
            status: 'success', 
            token, 
            user: { id: user.id, username: user.username, xp: user.xp, streak: user.streak } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
});

module.exports = router;
