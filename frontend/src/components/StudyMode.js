import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowLeft, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import AiChatbox from './AiChatbox';

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
  const [isLoading, setIsLoading] = useState(true);

  // Statistics
  const [sessionStats, setSessionStats] = useState({ easy: 0, medium: 0, hard: 0 });

  useEffect(() => {
    fetchCardsToReview();
  }, [deckId]);

  const fetchCardsToReview = async (force = false) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API_URL}/study?deck_id=${deckId}${force ? '&force=true' : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCardsToReview(data.data);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
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

  if (isLoading) return (
    <div className="flashcard-container">
      <div className="flashcard-inner">
         <div className="flashcard-front skeleton" style={{ border: 'none' }}>
            <div className="skeleton-title" style={{ margin: '0 auto 40px' }}></div>
            <div className="skeleton-text" style={{ width: '80%', margin: '0 auto 20px', height: '40px' }}></div>
            <div className="skeleton-text" style={{ width: '50%', margin: '0 auto', height: '40px' }}></div>
         </div>
      </div>
    </div>
  );

  if (!isLoading && cardsToReview.length === 0) {
    return (
      <div className="card text-center" style={{ maxWidth: '650px', margin: '40px auto', padding: '50px' }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>📭</div>
        <h2 className="mb-4" style={{ fontSize: '24px', fontWeight: '700' }}>
          Bạn đã hoàn thành mục tiêu hôm nay!
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.8, marginBottom: '30px' }}>
          Bộ thẻ này hiện không có từ vựng nào cần ôn tập thêm trong ngày hôm nay, hoặc nó chưa có thẻ nào.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button className="btn-outline" onClick={() => navigate('/')}>Quay lại thư viện</button>
          <button className="btn-primary" onClick={() => navigate(`/deck/${deckId}/cards`)}>Quản lý / Thêm thẻ</button>
        </div>
      </div>
    );
  }

  if (!isLoading && currentIndex >= cardsToReview.length && cardsToReview.length > 0) {
    const total = sessionStats.easy + sessionStats.medium + sessionStats.hard;

    // Trigger Confetti Gamification Component when session is complete
    if (currentIndex > 0 && currentIndex === cardsToReview.length) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#fbbf24', '#f43f5e']
      });
      // prevent re-triggering continuously by just setting state, but simplest is relying on the fact that this render only runs after state updates
    }

    return (
      <div className="card text-center" style={{ maxWidth: '650px', margin: '40px auto', padding: '40px' }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
        <h2 className="mb-4" style={{ fontSize: '28px', fontWeight: '800', background: 'linear-gradient(90deg, var(--primary-color), var(--success-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Bạn đã hoàn thành phiên học!
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '30px', opacity: 0.8 }}>
          Bạn đã cày qua <strong>{total}</strong> thẻ. Quá là tuyệt vời! 🔥
        </p>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-around', margin: '0 0 30px', background: 'rgba(255,255,255,0.05)', boxShadow: 'none' }}>
          <div style={{ color: 'var(--success-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <span style={{ fontSize: '24px', fontWeight: '800' }}>{sessionStats.easy}</span>
             <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Dễ (Easy)</span>
          </div>
          <div style={{ color: 'var(--warning-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <span style={{ fontSize: '24px', fontWeight: '800' }}>{sessionStats.medium}</span>
             <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Vừa (Medium)</span>
          </div>
          <div style={{ color: 'var(--danger-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <span style={{ fontSize: '24px', fontWeight: '800' }}>{sessionStats.hard}</span>
             <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>Khó (Hard)</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button className="btn-outline" onClick={() => navigate('/')} style={{ flex: 1 }}>Quay lại trang chủ</button>
          <button className="btn-primary" onClick={() => {
              setSessionStats({ easy: 0, medium: 0, hard: 0 });
              setCurrentIndex(0);
              fetchCardsToReview(true);
          }} style={{ flex: 1 }}>Ôn lại toàn bộ</button>
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
        <div className="action-bar fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: '15px', opacity: 0.7, marginBottom: '16px', fontWeight: '500' }}>Thẻ này có dễ nhớ với bạn không?</p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', width: '100%', maxWidth: '700px' }}>
            
            <button className="btn-danger eval-btn" onClick={() => handleLevelChoice('again')}>
              <span className="key-hint">1</span>
              <span className="time-label">{currentCard.btn_intervals?.again || '< 1d'}</span>
              <span className="desc-label">Lặp lại</span>
            </button>

            <button className="btn-warning eval-btn" onClick={() => handleLevelChoice('hard')}>
              <span className="key-hint">2</span>
              <span className="time-label">{currentCard.btn_intervals?.hard || '1d'}</span>
              <span className="desc-label">Khó</span>
            </button>

            <button className="btn-primary eval-btn" onClick={() => handleLevelChoice('good')}>
              <span className="key-hint">3</span>
              <span className="time-label">{currentCard.btn_intervals?.good || '3d'}</span>
              <span className="desc-label">Vừa</span>
            </button>

            <button className="btn-success eval-btn" onClick={() => handleLevelChoice('easy')}>
              <span className="key-hint">4</span>
              <span className="time-label">{currentCard.btn_intervals?.easy || '4d'}</span>
              <span className="desc-label">Dễ</span>
            </button>

          </div>
        </div>
      )}
      <AiChatbox currentCard={currentCard} />
    </div>
  );
}

export default StudyMode;
