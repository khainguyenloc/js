import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { AuthContext } from '../contexts/AuthContext';
import { BookOpen } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                login(data.user, data.token);
                navigate('/');
            } else {
                setError(data.message || 'Lỗi đăng nhập');
            }
        } catch (err) {
            setError('Lỗi kết nối đến server');
        }
    };

    return (
        <div className="auth-page">
            {/* VŨ TRỤ ẢO GIÁC PHÍA SAU (Orbs) */}
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>

            <div className="glass-card">
                <div className="auth-header">
                    <BookOpen size={48} color="var(--primary-color)" />
                    <h2>Đăng nhập Flashcard</h2>
                </div>
                
                {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
                
                <form onSubmit={handleLogin}>
                    <div>
                        <label style={{ fontWeight: '500', opacity: 0.8 }}>Tên đăng nhập:</label>
                        <input 
                            type="text" 
                            className="glass-input"
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            placeholder="Nhập tên đăng nhập"
                            required 
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: '500', opacity: 0.8 }}>Mật khẩu:</label>
                        <input 
                            type="password" 
                            className="glass-input"
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px', padding: '14px', fontSize: '16px' }}>Đăng nhập ngay</button>
                </form>
                
                <p style={{ marginTop: '24px', textAlign: 'center', opacity: 0.8 }}>
                    Học viên mới? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none' }}>Đăng ký tạo tài khoản</Link>
                </p>
            </div>
        </div>
    );
}
