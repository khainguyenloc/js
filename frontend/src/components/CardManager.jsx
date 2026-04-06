import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowLeft, ImagePlus, X, Volume2, AlertTriangle } from 'lucide-react';

const BACKEND = 'http://localhost:3000';

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND}${url}`;
};

function CardManager() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cardId: null });

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/flashcards?deck_id=${deckId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCards(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [deckId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!question || !answer) return;
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      let media_url = null;

      // Upload image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        const uploadRes = await fetch(`${BACKEND}/api/upload`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.status === 'success') {
          media_url = uploadData.url;
        }
      }

      const res = await fetch(`${API_URL}/flashcards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deck_id: deckId, question, answer, media_url })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setQuestion('');
        setAnswer('');
        clearImage();
        fetchCards();
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const handleDeleteCard = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/flashcards/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        fetchCards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = () => {
    if (deleteModal.cardId) {
      handleDeleteCard(deleteModal.cardId);
    }
    setDeleteModal({ isOpen: false, cardId: null });
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h2>Quản lý Thẻ</h2>
        <button className="btn-outline" onClick={() => navigate('/')}>
          <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }}/> Quay lại
        </button>
      </div>

      {/* Form thêm thẻ */}
      <div className="card mb-4">
        <h3 style={{ marginBottom: '20px' }}>✏️ Thêm thẻ mới</h3>
        <form onSubmit={handleAddCard}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', opacity: 0.7 }}>MẶT TRƯỚC (TỪ VỰNG)</label>
              <input 
                type="text" 
                placeholder="Từ tiếng Anh..." 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', opacity: 0.7 }}>MẶT SAU (NGHĨA)</label>
              <input 
                type="text"
                placeholder="Nghĩa tiếng Việt..." 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', opacity: 0.7 }}>HÌNH ẢNH MINH HOẠ (tuỳ chọn)</label>
          {!imagePreview ? (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px',
              border: '2px dashed var(--border-color)',
              borderRadius: '12px',
              cursor: 'pointer',
              marginBottom: '16px',
              opacity: 0.7,
              transition: 'all 0.2s'
            }}>
              <ImagePlus size={22} />
              <span>Nhấn để tải lên hình ảnh (JPG, PNG, GIF - tối đa 5MB)</span>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
            </label>
          ) : (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              <img src={imagePreview} alt="preview" style={{ height: '120px', borderRadius: '10px', display: 'block', objectFit: 'cover' }} />
              <button type="button" onClick={clearImage} style={{
                position: 'absolute', top: '-8px', right: '-8px',
                background: 'var(--danger-color)', border: 'none', color: 'white',
                borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <X size={14} />
              </button>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={uploading} style={{ width: '100%', padding: '12px' }}>
            {uploading ? 'Đang tải lên...' : '+ Thêm thẻ'}
          </button>
        </form>
      </div>

      {/* Danh sách thẻ */}
      <h3 style={{ marginBottom: '16px' }}>📋 Danh sách thẻ ({cards.length})</h3>
      <div className="grid-cards">
        {cards.map(card => (
          <div key={card.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {card.media_url && (
              <div style={{ height: '140px', overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>
                <img 
                  src={getImageSrc(card.media_url)} 
                  alt={card.question}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            )}
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700' }}>{card.question}</span>
                <button 
                  className="icon-btn"
                  style={{ padding: '6px', background: 'rgba(99,102,241,0.15)', borderRadius: '50%' }}
                  onClick={() => playAudio(card.question)}
                  title="Nghe phát âm"
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <p style={{ margin: '0 0 12px', opacity: 0.75, fontSize: '15px' }}>→ {card.answer}</p>
              <button className="btn-danger" style={{ width: '100%', padding: '8px' }} onClick={() => setDeleteModal({ isOpen: true, cardId: card.id })}>Xoá thẻ</button>
            </div>
          </div>
        ))}
        {cards.length === 0 && <p style={{ opacity: 0.6 }}>Chưa có thẻ nào trong bộ này.</p>}
      </div>

      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, cardId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Xác nhận xoá thẻ</h3>
            <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xoá thẻ từ vựng này không?<br/>
              Thẻ sẽ bị xoá vĩnh viễn khỏi hệ thống.
            </p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setDeleteModal({ isOpen: false, cardId: null })}>Huỷ</button>
              <button className="btn-danger" onClick={confirmDelete}>Đồng ý Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardManager;
