const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Không tìm thấy token truy cập.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id: 1, username: 'tester' }
        next();
    } catch (err) {
        res.status(401).json({ status: 'error', message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = authMiddleware;
