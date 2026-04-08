import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { BookOpen } from 'lucide-react';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            return setError('Mật khẩu nhập lại không khớp');
        }

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                setSuccess('Đăng ký thành công! Đang chuyển hướng...');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setError(data.message || 'Lỗi đăng ký');
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
                    <BookOpen size={48} color="var(--success-color)" />
                    <h2>Đăng ký Tài khoản</h2>
                </div>
                
                {error && <div style={{ color: '#ef4444', marginBottom: '16px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
                {success && <div style={{ color: '#10b981', marginBottom: '16px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{success}</div>}
                
                <form onSubmit={handleRegister}>
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
                            placeholder="Tạo mật khẩu"
                            required 
                        />
                    </div>
                    <div>
                        <label style={{ fontWeight: '500', opacity: 0.8 }}>Nhập lại Mật khẩu:</label>
                        <input 
                            type="password" 
                            className="glass-input"
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            placeholder="Xác nhận mật khẩu"
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-success" style={{ width: '100%', marginTop: '10px', padding: '14px', fontSize: '16px' }}>Đăng ký trải nghiệm</button>
                </form>
                
                <p style={{ marginTop: '24px', textAlign: 'center', opacity: 0.8 }}>
                    Đã có tài khoản? <Link to="/login" style={{ color: 'var(--success-color)', fontWeight: '700', textDecoration: 'none' }}>Đăng nhập ngay</Link>
                </p>
            </div>
        </div>
    );
}
