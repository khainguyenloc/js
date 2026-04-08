const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flashcard_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ✅ FIX GLOBAL: MySQL2 v3+ trả về BIGINT dưới dạng BigInt JS
  // typeCast ép mọi cột số nguyên về Number thông thường
  // Tránh lỗi so sánh BigInt !== Number ở mọi nơi trong project
  typeCast: function (field, next) {
    if (field.type === 'LONGLONG') {
      const val = field.string();
      return val === null ? null : Number(val);
    }
    return next();
  }
});

module.exports = pool;

