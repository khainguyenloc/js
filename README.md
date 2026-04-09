# 🎓 Bí kíp Bảo vệ Đồ án: Flashcard AI Tutor

Tài liệu này được biên soạn đặc biệt để làm "Phao cứu sinh" cho bạn khi lên thuyết trình dự án trước giảng viên. Hãy đọc kỹ, nắm rõ các khái niệm để đối đáp trôi chảy nhé!

---

## 1. 🏗️ Kiến trúc Hệ thống (System Architecture)

Dự án hoạt động theo mô hình **Client-Server (Khách - Chủ)** kết nối qua chuẩn **RESTful API**.

### Hai hệ thống giao tiếp với nhau như thế nào?
1. **Giao thức:** Frontend và Backend nói chuyện với nhau thông qua mạng HTTP/HTTPS bằng thư viện `fetch()` của trình duyệt. 
2. **Định dạng dữ liệu:** Mọi trao đổi đều được gói dưới dạng chuỗi **JSON** (JavaScript Object Notation). 
3. **CORS (Cross-Origin Resource Sharing):** Vì Frontend chạy ở tên miền khác (ví dụ `port 5173` hoặc Render) so với Backend (ở `port 3000`), trình duyệt mặc định sẽ chặn kết nối để chống hack. Để giải quyết, Backend sử dụng thư viện `cors` để cấp phép "mở cửa" cho Frontend kết nối vào.
4. **Xác thực (Authentication):** Khi Frontend gọi Backend để lấy bài học, nó phải gửi kèm tấm vé thông hành là **JWT Token** (đặt ở Header `Authorization: Bearer <token>`). Backend sẽ kiểm tra vé này, nếu đúng mới nhả dữ liệu MySQL về.

---

## 2. 💻 Công nghệ Frontend (Giao diện)
*Frontend là phần người dùng nhìn thấy, được viết theo dạng Single Page Application (Web một trang không cần tải lại).*

- **React 19 (Hooks):** Thư viện UI cốt lõi của Facebook. Tốc độ cao nhờ cơ chế Virtual DOM (DOM ảo).
- **Vite:** Công cụ Build (đóng gói) dự án thế hệ mới, nhanh gấp 10 lần Create-React-App truyền thống.
- **React Router Dom (v7):** Dùng để tạo các đường link (`/login`, `/study`) mà không làm tải lại (F5) trang web.
- **Lucide-React:** Thư viện Icon hiện đại bằng SVG, nhẹ và có thể đổi màu/kích thước bằng CSS.
- **Canvas-Confetti:** Thư viện tạo ra hiệu ứng "Cơn mưa pháo hoa" rực rỡ khi học xong bộ thẻ.
- **CSS3 (Vanilla + Glassmorphism):** Tự viết CSS tay hoàn toàn. Sử dụng kỹ thuật `backdrop-filter: blur(30px)` để tạo hiệu ứng "Kính mờ" xuyên thấu sang trọng. Lật thẻ 3D dùng phép biến hình `transform: rotateY()` qua hai mặt thay thế cho kỹ năng `preserve-3d` để tránh lỗi của Google Chrome.

---

## 3. ⚙️ Công nghệ Backend (Máy chủ & Xử lý logic)
*Backend đóng vai trò như bộ não và thủ kho, kiểm tra quy tắc và ghi chép dữ liệu.*

- **Node.js:** Môi trường chạy Javascript trên máy chủ ngoài trình duyệt. Chạy bất đồng bộ (Non-blocking I/O) nên chịu tải cực tốt.
- **Express.js:** Framework mạnh nhất của Node.js để thiết lập các đường dẫn API (`/api/auth`, `/api/decks`).
- **MySQL2 (mysql2/promise):** Trình điều khiển (Driver) giúp Nodejs kết nối đến MySQL và thực hiện các câu lệnh SQL tự động dưới dạng `async/await`.
- **JWT (Json Web Token):** Mã hóa phiên đăng nhập thành một chuỗi mã cực dài. Backend không cần lưu trạng thái người dùng (Stateless) mà chỉ cần giải mã chuỗi này là biết ai đang gọi.
- **Bcrypt:** Hàm băm (Hash) một chiều dùng để mã hóa mật khẩu. Nếu hacker trộm được Database cũng không thể đọc ra mật khẩu gốc. Lần đăng nhập sau, `bcrypt.compare` sẽ đối chiếu mật khẩu người dùng gõ vào và mã băm.
- **Multer:** Thư viện "Bắt" các file hình ảnh upload lên Backend và lưu chúng lại vào thư mục `/uploads`.
- **Dotenv:** Thư viện đọc biến môi trường bảo mật.

---

## 4. 🤖 Cách AI Tutor (Gemini) Hoạt động
Giảng viên có thể sẽ hỏi: *"Em gọi AI như thế nào?"*
**Câu trả lời chuẩn:** Dạ, ban đầu em định đưa logic gọi AI xuống Backend, nhưng để giảm độ trễ (latency) xuống mức thấp nhất và trải nghiệm người dùng là "thời gian thực" (Realtime), em đã cho Frontend gọi thẳng lên chuẩn **REST API v1beta của Google Generative Language** thông qua `fetch()`.
- Em chuẩn bị chuỗi `systemRole` ngầm ép AI đóng vai một chuyên gia Gia Sư tiếng Anh, không được tiết lộ thân phận là một con AI.
- Mọi Key bảo mật được đặt an toàn thông qua biến môi trường `import.meta.env.VITE_GEMINI_API_KEY` chứ không code chết trên máy.
- Nếu Google báo lỗi `503 High Demand` (Nghẽn mạng), hệ thống của em có thiết lập một vòng lặp chạy mảng `for` để **Tự động chuyển đổi mô hình (Intelligent Model Fallback)** từ bản nặng `gemini-2.5-flash` sang bản nhẹ `gemini-2.5-flash-lite` mà người dùng không hề bị đứt đoạn trải nghiệm!

---

## 5. 🧠 Phân tích Thuật toán Lặp Lại (Spaced Repetition)
Hệ thống tính ngày xuất hiện của Flashcard dựa trên độ khó mà người dùng chọn (Lấy cảm hứng từ thuật toán SuperMemo-2):
- **Cấu trúc lưu trữ:** Bảng `reviews` trên MySQL ghi lại độ dễ `ease` và ngày học kế tiếp `next_review_date`.
- **Logic Tính toán:** Nếu chọn "Easy" (Dễ), khoảng cách ngày học sẽ nhân lên với cường số cao (VD: 3 ngày -> 10 ngày). Nếu chọn "Again", khoảng cách bị reset về 0 để học lại ngay lập tức. Câu lệnh SQL `WHERE next_review_date <= CURDATE()` sẽ giúp Frontend lấy ra được chính xác các từ cần học đúng vào ngày hôm nay.

---

## 6. 🔥 Tủ Câu Hỏi - "Bộ Đề Cứu Nguy" khi bị Giảng Viên Vặn Hỏi

**❓ Thầy/Cô hỏi: Tại sao em lại cấu hình một cái Router tên là `/api/setup` trên Backend?**
> **Trả lời:** Dạ, khi cấu hình hệ thống trên mây (Deploy lên mạng), Database Aiven lúc đó hoàn toàn trống trơn. Thay vì em phải lên trang quản lý gõ SQL tạo từng bảng DB cho thầy cô xem 1 cách cực khổ, em viết tự động một Endpoint cải tiến mang tên `/api/setup` chạy lệnh `CREATE TABLE IF NOT EXISTS`. Chỉ cần truy cập đúng link đó 1 lần, Backend sẽ tự động Build trọn bộ khung cơ sở dữ liệu. Kỹ năng này tương đương với khái niệm Auto Migration của các doanh nghiệp lớn.

**❓ Thầy/Cô hỏi: Mật khẩu người dùng trong DB của em có bị lộ/bị hack không?**
> **Trả lời:** Chắc chắn là không ạ. Khi người dùng Register, em truyền mật khẩu qua hàm `bcrypt.hash()` với độ khó (salt) = 10, biến đoạn text "123456" thành dãy băm 60 ký tự lộn xộn. Bản thân em kể cả khi chọc vào Admin Database trực tiếp cũng không thể dịch ngược ra mật khẩu gốc được.

**❓ Thầy/Cô hỏi: Làm sao ứng dụng em phân biệt được Sinh viên A và Sinh viên B để trả về đúng thẻ bài của người đó?**
> **Trả lời:** Chìa khóa ở đây là cơ chế bảo mật (JWT). Khi sinh viên Login thành công, hệ thống nhả ra cái Token. Frontend nhét Token đó vào bộ nhớ trong `localStorage`. Từ đó về sau, mỗi lần gọi hàm lấy bài học, vòng lặp Frontend sẽ đính cái dây Token này vào Header API. Tới máy chủ Backend, một "cửa ải" Middleware tên là `auth.js` sẽ bắt Token đó lại, lấy khóa bí mật `JWT_SECRET` để giải mã ra được cái `user_id` thật của người đó, gán vào `req.user`. Từ đó các khối lệnh SQL sau này chỉ xài biến `user_id` nội bộ đó. Tuyệt đối không ai hack qua được dữ liệu của nhau.

**❓ Thầy/Cô hỏi: Cấu hình tải và sử dụng Ảnh (Upload Hình minh họa thẻ bài) hoạt động ra sao?**
> **Trả lời:** Em sử dụng gói `multer` trên API Backend của em. Dữ liệu thay vì truyền JSON thì ở đây nó sẽ truyền định dạng FormData (Dạng nhị phân). Khi nhận được file ảnh, Backend sẽ lưu xuống ổ cứng và cấp ngay cái chuỗi đường dẫn `/uploads/hihi.png` đáp lại Frontend. Frontend sau đó sẽ lưu chuỗi `/uploads/...` đó vào Database làm thông tin thẻ, và dùng đường dẫn đó hiển thị ra thẻ HTML là xong ạ.

---
*Cảm ơn bạn đã hợp tác cùng siêu trí tuệ nhân tạo Antigravity. Chúc bạn báo cáo đạt thủ khoa xuất sắc nhất khóa! 🚀*
