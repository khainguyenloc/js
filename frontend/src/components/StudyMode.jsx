import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowLeft, Volume2 } from 'lucide-react';

const BACKEND = 'http://localhost:3000';

// Nếu là ảnh local (/uploads/...) thì thêm backend URL, còn external URL thì dùng thẳng
const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BACKEND}${url}`;
};

function StudyMode() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [cardsToReview, setCardsToReview] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  // Statistics
  const [sessionStats, setSessionStats] = useState({ easy: 0, medium: 0, hard: 0 });

  useEffect(() => {
    fetchCardsToReview();
  }, [deckId]);

  const fetchCardsToReview = async (force = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API_URL}/study?deck_id=${deckId}${force ? '&force=true' : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCardsToReview(data.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for better learning
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleFlip = () => {
    if (!isFlipped && cardsToReview[currentIndex]) {
      // Play audio automatically when flipping to see the answer
      playAudio(cardsToReview[currentIndex].question);
    }
    setIsFlipped(!isFlipped);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

      if (!isFlipped && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.code === 'Space') {
          e.preventDefault();
        }
        if (e.key === '1') handleLevelChoice('again');
        if (e.key === '2') handleLevelChoice('hard');
        if (e.key === '3') handleLevelChoice('good');
        if (e.key === '4') handleLevelChoice('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, cardsToReview]);

  const handleLevelChoice = async (quality) => {
    const card = cardsToReview[currentIndex];
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/study/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ card_id: card.id, quality })
      });
      const data = await res.json();
      if (data.status === 'success') {
        // Update stats mapping hard->hard, good->medium, etc. just for UI tracking
        const statKey = quality === 'again' || quality === 'hard' ? 'hard' : (quality === 'good' ? 'medium' : 'easy');
        setSessionStats(prev => ({ ...prev, [statKey]: prev[statKey] + 1 }));
        
        // Next card setup
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
        }, 150); // slight delay for smooth transition
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className="text-center mt-4">Đang tải thẻ...</p>;

  if (cardsToReview.length === 0 || currentIndex >= cardsToReview.length) {
    const total = sessionStats.easy + sessionStats.medium + sessionStats.hard;
    return (
      <div className="card text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 className="mb-4">🎉 Bạn đã hoàn thành phiên học!</h2>
        <p>Bạn đã ôn tập tổng cộng: <strong>{total}</strong> thẻ</p>
        <div style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
          <div style={{ color: 'var(--success-color)' }}>Dễ (Easy): {sessionStats.easy}</div>
          <div style={{ color: 'var(--warning-color)' }}>Vừa (Medium): {sessionStats.medium}</div>
          <div style={{ color: 'var(--danger-color)' }}>Khó (Hard): {sessionStats.hard}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
          <button className="btn-primary" onClick={() => navigate('/')}>Quay lại trang chủ</button>
          <button className="btn-success" onClick={() => {
              setSessionStats({ easy: 0, medium: 0, hard: 0 });
              setCurrentIndex(0);
              fetchCardsToReview(true);
          }}>Ôn lại toàn bộ thẻ</button>
        </div>
      </div>
    );
  }

  const currentCard = cardsToReview[currentIndex];
  // Calculate Progress
  const progressPercentage = (currentIndex / cardsToReview.length) * 100;

  return (
    <div>
      <div className="flex-between mb-4" style={{ maxWidth: '600px', margin: '0 auto 20px' }}>
        <button className="btn-outline" onClick={() => navigate('/')}>
          <ArrowLeft size={16} style={{ display: 'inline', verticalAlign: 'middle' }}/> Thoát phiên học
        </button>
        <span style={{ fontWeight: 'bold' }}>
          Thẻ {currentIndex + 1} / {cardsToReview.length}
        </span>
      </div>

      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <div className={`flashcard-container ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flashcard-inner">
          {/* Front face */}
          <div className="flashcard-front">
            <div className="flashcard-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span>Câu hỏi (Tiếng Anh)</span>
              <button 
                className="icon-btn" 
                style={{ padding: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  playAudio(currentCard.question); 
                }}
                title="Nghe phát âm"
              >
                <Volume2 size={20} />
              </button>
            </div>

            {currentCard.media_url && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
                <img 
                  src={getImageSrc(currentCard.media_url)} 
                  alt={currentCard.question}
                  style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '10px', objectFit: 'contain' }}
                />
              </div>
            )}

            <div className="flashcard-content" style={{ flex: currentCard.media_url ? '0 0 auto' : 1, fontSize: currentCard.media_url ? '22px' : '28px' }}>
              {currentCard.question}
            </div>
            <p style={{ fontSize: '13px', opacity: 0.5, marginTop: '10px' }}>
              <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', marginRight: '4px' }}>Space</kbd> 
              hoặc click để lật thẻ
            </p>
          </div>

          {/* Back face */}
          <div className="flashcard-back">
            <div className="flashcard-label" style={{ marginBottom: '12px', width: '100%' }}>Trả lời (Tiếng Việt)</div>

            {currentCard.media_url && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
                <img 
                  src={getImageSrc(currentCard.media_url)} 
                  alt={currentCard.answer}
                  style={{ maxHeight: '160px', maxWidth: '100%', borderRadius: '10px', objectFit: 'contain', opacity: 0.85 }}
                />
              </div>
            )}

            <div className="flashcard-content" style={{ flex: currentCard.media_url ? '0 0 auto' : 1, fontSize: currentCard.media_url ? '22px' : '28px' }}>
              {currentCard.answer}
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="action-bar fade-in">
          <p style={{ width: '100%', textAlign: 'center', marginBottom: '10px' }}>Đánh giá mức độ để thẻ lặp lại sau:</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', width: '100%' }}>
            <button className="btn-danger" onClick={() => handleLevelChoice('again')} style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', opacity: 0.8, color: 'white' }}>Phím 1</span>
              <span style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>1m</span>
              Lại (Again)
            </button>
            <button className="btn-warning" onClick={() => handleLevelChoice('hard')} style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', opacity: 0.8, color: 'white' }}>Phím 2</span>
              <span style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Sớm</span>
              Khó (Hard)
            </button>
            <button className="btn-primary" onClick={() => handleLevelChoice('good')} style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', opacity: 0.8, color: 'white' }}>Phím 3</span>
              <span style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Ít Ngày</span>
              Tốt (Good)
            </button>
            <button className="btn-success" onClick={() => handleLevelChoice('easy')} style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', opacity: 0.8, color: 'white' }}>Phím 4</span>
              <span style={{ display: 'block', fontSize: '18px', fontWeight: 'bold' }}>Nhiều Ngày</span>
              Dễ (Easy)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyMode;
