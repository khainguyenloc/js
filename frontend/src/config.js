// frontend/src/config.js
// Cấu hình linh hoạt: Sẽ tự gọi API trên mạng khi được Deploy lên Render, và tự chạy Localhost khi code ở máy.
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_URL = `${BASE_URL}/api`;
