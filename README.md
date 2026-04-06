# Ứng dụng Học Từ Vựng Flashcard (React + PHP/XAMPP)

Hướng dẫn cài đặt để chạy dự án.

## Yêu cầu Hệ thống
- Máy tính đã cài đặt **XAMPP**.
- Đã cài đặt **Node.js** (để chạy cấu hình React Vite).

## Bước 1: Thiết lập Cơ sở dữ liệu (Database)
1. Mở XAMPP Control Panel, Start **Apache** và **MySQL**.
2. Mở trình duyệt vào trang: `http://localhost/phpmyadmin`
3. Chuyển sang tab **Import**, chọn file `database/flashcard_db.sql` trong dự án này và bấm **Go** (Thực hiện).
4. Bạn sẽ thấy database tên là `flashcard_db` với 4 bảng được tạo sẵn.

## Bước 2: Thiết lập Backend PHP
Backend PHP mặc định có thể chạy độc lập không cần di chuyển code bằng cách mở một Terminal (Command Prompt / VS Code Terminal) ở ngay trong thư mục `backend/` và gõ lệnh sau:
```bash
cd backend
php -S localhost:8000
```
> Lúc này Backend sẽ chạy tại: `http://localhost:8000`

*Lưu ý: Nếu không dùng lệnh trên, bạn có thể copy nguyên thư mục `backend` vào thư mục `C:\xampp\htdocs\flashcard` nhưng lúc này bạn sẽ cần sửa đường dẫn url API trong cấu hình của React.*

## Bước 3: Chạy Frontend React
Mở một cửa sổ Terminal (hoặc tab Terminal thứ 2 trong VS Code) trỏ vào thư mục `frontend/`:
```bash
cd frontend
npm install   # Cài đặt thư viện nếu chưa cài
npm run dev   # Khởi chạy frontend
```
> Trình duyệt sẽ cấp một localhost port cho React (Thường là http://localhost:5173). Bấm vào để mở giao diện của bạn!

## Cấu trúc Dự án
- `database/flashcard_db.sql` - Quản lý tables database.
- `backend/` - API viết bằng PHP thuần.
  - `config/database.php` (Kết nối PDO)
  - `api/` (Chứa các Restful methods như GET/POST progress, decks, cards)
- `frontend/` - Source React bằng Vite.
  - `src/components/DeckList.jsx` (Màn hình chính liệt kê bộ bài)
  - `src/components/CardManager.jsx` (CRUD danh sách từng thẻ bài trong bộ)
  - `src/components/StudyMode.jsx` (Cửa sổ học Spaced Repetition lật thẻ 3D)
  - `src/index.css` (Giao diện Dark/Light mode và animation flips).
