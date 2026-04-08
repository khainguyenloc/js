const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flashcard_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  typeCast: function (field, next) {
    if (field.type === 'LONGLONG') {
      const val = field.string();
      return val === null ? null : Number(val);
    }
    return next();
  }
};

// 👉 CỰC KỲ QUAN TRỌNG CHO RENDER & AIVEN: Bật SSL nếu không phải máy cá nhân
if (dbConfig.host !== '127.0.0.1' && dbConfig.host !== 'localhost') {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;

