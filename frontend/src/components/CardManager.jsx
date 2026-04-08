import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, BASE_URL } from '../config';
import { ArrowLeft, ImagePlus, X, Volume2, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
};

function CardManager() {
  const params = useParams();
  const deckId = params.deckId || params.id;
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, cardId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, card: null });
  const [bulkModal, setBulkModal] = useState({ isOpen: false, text: '' });
  const [editForm, setEditForm] = useState({ question: '', answer: '', imageFile: null, imagePreview: null, media_url: null });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchCards = async () => {
    // Guard: không fetch nếu deckId chưa sẵn sàng
    if (!deckId) {
      console.warn('[CardManager] deckId là undefined, bỏ qua fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log(`[CardManager] Fetching cards for deck_id=${deckId}`);
      
      const res = await fetch(`${API_URL}/flashcards?deck_id=${deckId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Kiểm tra HTTP status trước khi parse JSON
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      console.log('[CardManager] API response:', data);
      
      if (data.status === 'success') {
        setCards(data.data || []);
      } else {
        throw new Error(data.message || 'API trả về lỗi');
      }
    } catch (err) {
      console.error('[CardManager] fetchCards error:', err.message);
      addToast(`Không thể tải dữ liệu: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deckId) fetchCards();
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
    if (!question.trim() || !answer.trim()) return;
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      let media_url = null;

      // Upload ảnh nếu có
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
        body: JSON.stringify({ deck_id: parseInt(deckId, 10), question: question.trim(), answer: answer.trim(), media_url })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.status === 'success') {
        // ✅ Optimistic update: thêm thẳng vào state, không cần refetch
        const newCard = data.data;
        setCards(prev => [newCard, ...prev]);
        
        // Clear form
        setQuestion('');
        setAnswer('');
        clearImage();
        addToast('Thêm từ vựng thành công! ✅');
      } else {
        throw new Error(data.message || 'Thêm thẻ thất bại');
      }
    } catch (err) {
      console.error('[CardManager] handleAddCard error:', err.message);
      addToast(`Lỗi khi thêm thẻ: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
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
        addToast('Xoá từ vựng thành công!');
        fetchCards();
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi khi xoá từ', 'error');
    }
  };

  const confirmDelete = () => {
    if (deleteModal.cardId) {
      handleDeleteCard(deleteModal.cardId);
    }
    setDeleteModal({ isOpen: false, cardId: null });
  };

  const openEditModal = (card) => {
    setEditModal({ isOpen: true, card });
    setEditForm({
      question: card.question,
      answer: card.answer,
      imageFile: null,
      imagePreview: getImageSrc(card.media_url),
      media_url: card.media_url,
    });
  };

  const clearEditImage = () => {
    setEditForm({ ...editForm, imageFile: null, imagePreview: null, media_url: null });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditForm({
      ...editForm,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    });
  };

  const handleUpdateCard = async (e) => {
    if (e) e.preventDefault();
    if (!editForm.question || !editForm.answer) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      let new_media_url = editForm.media_url;

      if (editForm.imageFile) {
        const formData = new FormData();
        formData.append('image', editForm.imageFile);
        const uploadRes = await fetch(`${BACKEND}/api/upload`, {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.status === 'success') {
          new_media_url = uploadData.url;
        }
      }

      const res = await fetch(`${API_URL}/flashcards/${editModal.card.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: editForm.question, answer: editForm.answer, media_url: new_media_url })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setEditModal({ isOpen: false, card: null });
        addToast('Cập nhật từ vựng thành công!');
        fetchCards();
      }
    } catch (err) {
      console.error(err);
      addToast('Lỗi cập nhật từ', 'error');
    }
    setUploading(false);
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

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    if (!bulkModal.text.trim()) return;
    
    // Parse the textarea logic
    const lines = bulkModal.text.split('\n');
    const parsedCards = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split('|');
      if (parts.length >= 2) {
        parsedCards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join('|').trim() // In case the back has a | character
        });
      }
    }
    
    if (parsedCards.length === 0) {
      addToast('Không tìm thấy thẻ hợp lệ. Vui lòng nhập định dạng: Từ vựng | Nghĩa', 'error');
      return;
    }
    
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/flashcards/bulk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ deck_id: parseInt(deckId, 10), cards: parsedCards })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        addToast(`Thêm hàng loạt ${parsedCards.length} thẻ thành công! ✅`);
        setBulkModal({ isOpen: false, text: '' });
        fetchCards();
      } else {
        throw new Error(data.message || 'Lỗi từ server');
      }
    } catch (err) {
      console.error('[CardManager] handleBulkAdd error:', err.message);
      addToast(`Lỗi: ${err.message}`, 'error');
    } finally {
      setUploading(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>✏️ Thêm thẻ mới</h3>
          <button type="button" className="btn-outline" onClick={() => setBulkModal({ isOpen: true, text: '' })}>
            📥 Nhập hàng loạt
          </button>
        </div>
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
        {loading ? (
          <>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card skeleton" style={{ padding: '0', height: '180px' }}>
                <div className="skeleton-img"></div>
              </div>
            ))}
          </>
        ) : (
          cards.map(card => (
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-outline" style={{ flex: 1, padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => openEditModal(card)}>
                    <Edit2 size={16} /> Sửa
                  </button>
                  <button className="btn-danger" style={{ flex: 1, padding: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} onClick={() => setDeleteModal({ isOpen: true, cardId: card.id })}>
                    <Trash2 size={16} /> Xoá
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {!loading && cards.length === 0 && <p style={{ opacity: 0.6 }}>Chưa có thẻ nào trong bộ này.</p>}
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

      {editModal.isOpen && (
        <div className="modal-overlay" onClick={() => setEditModal({ isOpen: false, card: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="flex-between mb-4">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Edit2 size={20} /> Sửa thẻ</h3>
              <button className="icon-btn" onClick={() => setEditModal({ isOpen: false, card: null })}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdateCard}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', opacity: 0.7 }}>MẶT TRƯỚC (TỪ VỰNG)</label>
                  <input type="text" value={editForm.question} onChange={(e) => setEditForm({...editForm, question: e.target.value})} required className="input-field" style={{ width: '100%', padding: '10px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', opacity: 0.7 }}>MẶT SAU (NGHĨA)</label>
                  <input type="text" value={editForm.answer} onChange={(e) => setEditForm({...editForm, answer: e.target.value})} required className="input-field" style={{ width: '100%', padding: '10px' }} />
                </div>
              </div>

              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', opacity: 0.7 }}>HÌNH ẢNH MINH HOẠ</label>
              {!editForm.imagePreview ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', border: '2px dashed var(--border-color)', borderRadius: '12px', cursor: 'pointer', marginBottom: '16px', opacity: 0.7 }}>
                  <ImagePlus size={22} />
                  <span>Cập nhật hình ảnh (JPG, PNG)</span>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleEditImageChange} />
                </label>
              ) : (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                  <img src={editForm.imagePreview} alt="preview" style={{ height: '120px', borderRadius: '10px', display: 'block', objectFit: 'cover' }} />
                  <button type="button" onClick={clearEditImage} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--danger-color)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-outline" onClick={() => setEditModal({ isOpen: false, card: null })}>Huỷ thao tác</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkModal.isOpen && (
        <div className="modal-overlay" onClick={() => setBulkModal({ isOpen: false, text: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="flex-between mb-4">
              <h3 style={{ margin: 0 }}>📥 Nhập hàng loạt</h3>
              <button className="icon-btn" onClick={() => setBulkModal({ isOpen: false, text: '' })}><X size={20} /></button>
            </div>
            
            <p style={{ opacity: 0.8, fontSize: '14px', marginBottom: '10px' }}>
              Quy tắc nhập: <strong>Từ vựng | Nghĩa</strong> (mỗi thẻ một dòng).<br/>
              Ví dụ:<br/>
              <code style={{ background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>Hello | Xin chào</code><br/>
              <code style={{ background: 'var(--bg-color)', padding: '2px 6px', borderRadius: '4px' }}>Home | Nhà</code>
            </p>
            
            <textarea
              className="input-field"
              style={{ width: '100%', minHeight: '200px', padding: '12px', fontSize: '15px', resize: 'vertical' }}
              placeholder="Nhập theo định dạng mỗi thẻ 1 dòng..."
              value={bulkModal.text}
              onChange={(e) => setBulkModal({ ...bulkModal, text: e.target.value })}
            ></textarea>
            
            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-outline" onClick={() => setBulkModal({ isOpen: false, text: '' })}>Huỷ</button>
              <button className="btn-primary" onClick={handleBulkAdd} disabled={uploading || !bulkModal.text.trim()}>
                {uploading ? 'Đang nhập...' : 'Xác nhận nhập'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardManager;
