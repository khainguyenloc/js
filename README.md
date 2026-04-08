# 🎓 Flashcard AI Tutor - Hệ thống Học tập Thông minh

Chào mừng bạn đến với **Flashcard AI Tutor**, một ứng dụng học tập hiện đại kết hợp sức mạnh của phương pháp **Spaced Repetition (Lặp lại ngắt quãng)** và trí tuệ nhân tạo **Gemini AI** để tối ưu hóa quá trình ghi nhớ từ vựng và kiến thức.

---

## 🚀 Tính năng nổi bật

- **🤖 AI Tutor (Gemini Integration)**: Trợ lý ảo hỗ trợ giải thích từ vựng, đưa ra ví dụ thực tế và tìm từ đồng nghĩa ngay trong lúc học.
- **🧠 Thuật toán SRS (SuperMemo-2)**: Tự động tính toán ngày ôn tập tối ưu dựa trên mức độ ghi nhớ của bạn, giúp tiết kiệm thời gian và nhớ lâu hơn.
- **🎮 Gamification**: Hệ thống điểm kinh nghiệm (XP) và Chuỗi ngày học (Streak) giúp tạo động lực học tập mỗi ngày.
- **🖼️ Đa phương tiện**: Hỗ trợ đính kèm hình ảnh vào các thẻ ghi nhớ (Flashcard) để tăng khả năng liên tưởng.
- **📱 Giao diện hiện đại**: Thiết kế Dark Mode chuyên nghiệp theo phong cách Quizlet, tối ưu cho trải nghiệm người dùng.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 💻 Frontend
- **React 19**: Thư viện UI mạnh mẽ nhất hiện nay.
- **Vite**: Công cụ build siêu nhanh thay thế cho Create React App.
- **React Router Dom 7**: Quản lý điều hướng trang.
- **Lucide React**: Bộ icon phong cách tối giản và hiện đại.
- **Canvas Confetti**: Hiệu ứng chúc mừng khi hoàn thành mục tiêu học tập.
- **Vanilla CSS**: Tùy biến giao diện linh hoạt, tối ưu hiệu năng.

### ⚙️ Backend
- **Node.js & Express 5**: Framework backend tin cậy và hiệu năng cao.
- **MySQL (mysql2)**: Cơ sở dữ liệu quan hệ mạnh mẽ.
- **JWT (JsonWebToken)**: Hệ thống xác thực người dùng an toàn.
- **Bcrypt**: Mã hoá mật khẩu bảo mật tuyệt đối.
- **Multer**: Xử lý tải lên hình ảnh cho Flashcard.
- **Gemini AI SDK**: Kết nối trực tiếp với các mô hình ngôn ngữ lớn của Google.

---

## 📊 Cơ cấu Cơ sở dữ liệu (Database Schema)

Dự án sử dụng 5 bảng chính trong cơ sở dữ liệu `flashcard_db`:

1. **`users`**: Lưu trữ thông tin tài khoản, mật khẩu (đã mã hoá), XP và Streak.
2. **`decks`**: Quản lý các bộ thẻ (decks) do người dùng tạo ra.
3. **`flashcards`**: Lưu trữ các câu hỏi, câu trả lời, hình ảnh và loại thẻ (basic, trắc nghiệm...).
4. **`reviews`**: Trái tim của hệ thống SRS, lưu trữ chỉ số `ease`, `interval_days` và `next_review_date` cho từng thẻ.
5. **`study_sessions`**: Ghi lại lịch sử học tập hàng ngày để tính toán điểm thưởng và thống kê.

---

## 🤖 Cơ chế AI Tutor

Hệ thống AI được thiết kế cực kỳ linh hoạt:
- **Tự động chọn Model**: Ưu tiên sử dụng `Gemini 2.0 Flash Lite`, `1.5 Flash` tùy theo hạn mức API.
- **Chế độ Smart Mock**: Nếu chưa có API Key, hệ thống sẽ tự động chuyển sang chatbot thông minh được lập trình sẵn để đảm bảo trải nghiệm không bị gián đoạn.
- **Hỗ trợ 4 chế độ**: Giải thích chi tiết, Lấy ví dụ, Tìm từ đồng nghĩa và Chat tự do về từ vựng.

---

## 🧠 Thuật toán Lặp lại ngắt quãng (SRS)

Ứng dụng áp dụng phiên bản cải tiến của **SM-2 (SuperMemo 2)**:
- **Again**: Reset chu kỳ, ôn tập lại ngay.
- **Hard**: Tăng khoảng cách nhẹ (x1.2), giảm độ dễ.
- **Good**: Tăng khoảng cách theo hệ số Ease (x2.5).
- **Easy**: Tăng mạnh khoảng cách (x3.25), tăng độ dễ.

---

## 🏗️ Hướng dẫn cài đặt & Chạy dự án

### 1. Yêu cầu hệ thống
- **Node.js** (v18 trở lên)
- **MySQL Server** đang chạy.

### 2. Cài đặt Cơ sở dữ liệu
```bash
# Vào thư mục backend
cd backend
# Chạy script khởi tạo DB (Đảm bảo file .env đã cấu hình DB_USER, DB_PASSWORD)
node setup_db.js
```

### 3. Khởi động Backend
```bash
cd backend
npm install
npm run dev
```

### 4. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Cấu trúc thư mục chính

```text
├── backend/
│   ├── routes/         # Các API endpoint (auth, ai, decks, study...)
│   ├── middleware/     # Bảo mật và xác thực JWT
│   ├── server.js       # File khởi chạy server chính
│   └── db.js           # Kết nối database MySQL
├── frontend/
│   ├── src/
│   │   ├── components/ # Các thành phần giao diện (Sidebar, Chatbox, CardManager...)
│   │   ├── pages/      # Các trang chính (Login, Register, Dashboard...)
│   │   ├── contexts/   # Quản lý trạng thái (Auth, Toast...)
│   │   └── App.jsx     # Thành phần gốc điều hướng
└── README.md           # Hướng dẫn này
```

---

*Chúc bạn có những trải nghiệm học tập tuyệt vời với Flashcard AI Tutor! 🚀*
