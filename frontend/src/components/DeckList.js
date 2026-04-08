import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

function DeckList() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, deckId: null, deckName: '' });
  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchDecks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/decks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDecks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch decks', err);
      addToast('Lỗi khi tải danh sách thẻ', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/decks/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        addToast('Xoá bộ thẻ thành công!');
        fetchDecks();
      }
    } catch (err) {
      console.error(err);
      addToast('Không thể xoá thẻ', 'error');
    }
  };

  const confirmDelete = () => {
    if (deleteModal.deckId) {
      handleDelete(deleteModal.deckId);
    }
    setDeleteModal({ isOpen: false, deckId: null, deckName: '' });
  };

  return (
    <div>

      <h2>Danh Sách Bộ Thẻ của Bạn</h2>
      <div className="grid-cards mt-4">
        {loading ? (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="card skeleton" style={{ height: '230px' }}>
                <div className="skeleton-title" style={{ marginBottom: '20px' }}></div>
                <div className="skeleton-text" style={{ width: '80%' }}></div>
                <div className="skeleton-text" style={{ width: '40%' }}></div>
                <div style={{ marginTop: '30px' }}>
                   <div className="skeleton-text" style={{ width: '100%' }}></div>
                   <div className="skeleton-text" style={{ width: '100%' }}></div>
                </div>
              </div>
            ))}
          </>
        ) : (
          decks.map(deck => (
            <div key={deck.id} className="card">
              <h3>{deck.name}</h3>
              <p style={{ margin: '10px 0', opacity: 0.8, fontSize: '14px' }}>
                {deck.description || 'Không có mô tả'}
              </p>
              <p style={{ fontWeight: '600', marginBottom: '15px' }}>
                📚 {deck.card_count} thẻ
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="btn-success" 
                  onClick={() => navigate(`/study/${deck.id}`)}
                  disabled={deck.card_count == 0}
                >
                  Học bài
                </button>
                <button 
                  className="btn-outline" 
                  onClick={() => navigate(`/deck/${deck.id}/cards`)}
                >
                  Quản lý Thẻ ({deck.card_count})
                </button>
                <button 
                  className="btn-danger" 
                  onClick={() => setDeleteModal({ isOpen: true, deckId: deck.id, deckName: deck.name })}
                >
                  Xoá bộ thẻ
                </button>
              </div>
            </div>
          ))
        )}
        {!loading && decks.length === 0 && <p>Chưa có bộ thẻ nào.</p>}
      </div>

      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, deckId: null, deckName: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={32} />
            </div>
            <h3 style={{ marginBottom: '10px' }}>Xác nhận xoá bộ thẻ</h3>
            <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xoá bộ thẻ <strong style={{ color: 'var(--primary-color)' }}>{deleteModal.deckName}</strong> không?<br/>
              <span style={{ fontSize: '13px', color: 'var(--danger-color)' }}>(Hành động này sẽ xoá vĩnh viễn tất cả flashcard bên trong)</span>
            </p>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setDeleteModal({ isOpen: false, deckId: null, deckName: '' })}>Huỷ thao tác</button>
              <button className="btn-danger" onClick={confirmDelete}>Đồng ý Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckList;
