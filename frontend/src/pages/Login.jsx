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
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }} className="card">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <BookOpen size={48} />
                <h2>Đăng nhập Flashcard</h2>
            </div>
            
            {error && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}
            
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Tên đăng nhập:</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Mật khẩu:</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                    />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Đăng nhập</button>
            </form>
            
            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
        </div>
    );
}
