const pool = require('./db');

const initDb = async () => {
    try {
        const connection = await pool.getConnection();

        // Chú ý: Đoạn này sẽ xoá bảng cũ để tạo bảng mới theo yêu cầu
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS study_sessions, reviews, progress, flashcards, decks, users');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Đang tạo các bảng mới...');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                xp INT DEFAULT 0,
                streak INT DEFAULT 0,
                last_login_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS decks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS flashcards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                deck_id INT,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                media_url VARCHAR(255),
                type ENUM('basic', 'multiple-choice', 'fill-in-the-blank') DEFAULT 'basic',
                options JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                card_id INT,
                ease FLOAT DEFAULT 2.5,
                interval_days INT DEFAULT 0,
                next_review_date DATE,
                review_count INT DEFAULT 0,
                last_reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY user_card_unique (user_id, card_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS study_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                deck_id INT,
                date DATE,
                cards_reviewed INT DEFAULT 0,
                correct_count INT DEFAULT 0,
                xp_earned INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
            )
        `);

        console.log('Đã tạo bảng thành công!');
        connection.release();
        process.exit();
    } catch (err) {
        console.error('Lỗi khi khởi tạo database:', err);
        process.exit(1);
    }
};

initDb();
