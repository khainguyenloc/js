import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowLeft } from 'lucide-react';

export default function CreateDeck() {
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckDesc, setNewDeckDesc] = useState('');
  const navigate = useNavigate();

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckName) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/decks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newDeckName, description: newDeckDesc })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const newDeckId = data.data.id;
        // Chuyển thẳng sang giao diện thêm thẻ
        navigate(`/deck/${newDeckId}/cards`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex-between mb-4">
        <h2>Tạo Bộ Thẻ Mới</h2>
        <button className="btn-outline" onClick={() => navigate('/')}>
          <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }}/> Hủy
        </button>
      </div>

      <div className="card mb-4" style={{ animation: 'fade-in 0.3s ease' }}>
        <form onSubmit={handleCreateDeck} className="mt-4">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Tên bộ thẻ</label>
          <input 
            type="text" 
            placeholder="Ví dụ: Tiếng Nhật Bản N5" 
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            required 
            autoFocus
          />
          
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Mô tả (tùy chọn)</label>
          <textarea 
            placeholder="Mô tả tóm tắt nội dung bộ thẻ..." 
            value={newDeckDesc}
            onChange={(e) => setNewDeckDesc(e.target.value)}
            rows="3"
          ></textarea>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
            Tạo và Bắt đầu thêm thẻ
          </button>
        </form>
      </div>
    </div>
  );
}
