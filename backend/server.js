
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
require("dotenv").config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Import routes (will be created soon)
const authRoutes = require("./routes/auth.js");
const deckRoutes = require("./routes/decks.js");
const flashcardRoutes = require("./routes/flashcards.js");
const studyRoutes = require("./routes/study.js");
const userRoutes = require("./routes/users.js");
const aiRoutes = require("./routes/ai.js");

app.use("/api/auth", authRoutes);
app.use("/api/decks", deckRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

// Upload image endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ status: "success", url: imageUrl });
});

// 👉 MÀN HÌNH CẤU HÌNH TỰ ĐỘNG (Dùng khi mạng lên Render/Aiven lần đầu)
app.get("/api/setup", async (req, res) => {
  try {
    const pool = require("./db");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        last_login_date DATE NULL,
        xp INT DEFAULT 0,
        streak INT DEFAULT 0,
        role VARCHAR(20) DEFAULT 'user'
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS decks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deck_id INT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        media_url VARCHAR(255),
        type VARCHAR(50) DEFAULT 'basic',
        options JSON,
        box_number INT DEFAULT 1,
        next_review_date DATE,
        btn_intervals JSON,
        FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        card_id INT NOT NULL,
        ease VARCHAR(20),
        interval_days INT,
        next_review_date DATE,
        review_count INT DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (card_id) REFERENCES flashcards(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        date DATE,
        cards_reviewed INT DEFAULT 0,
        correct_count INT DEFAULT 0,
        xp_earned INT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    res.json({ status: "success", message: "Đã tự động khởi tạo các bảng (Tables) thành công cho Database của bạn!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

const PORT = process.env.PORT || 3306;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
