import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL, BASE_URL } from '../config';
import { ArrowLeft, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import AiChatbox from './AiChatbox';

// Nếu là ảnh local (/uploads/...) thì thêm backend URL, còn external URL thì dùng thẳng
const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url}`;
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

  useEffect(() => {
    // Kích hoạt pháo hoa khi vừa hoàn thành bộ thẻ
    if (!isLoading && currentIndex > 0 && currentIndex === cardsToReview.length) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [currentIndex, cardsToReview?.length, isLoading]);

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

    return (
      <div className="card text-center" style={{ 
        maxWidth: '650px', 
        margin: '40px auto', 
        padding: '50px 40px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{ fontSize: '70px', marginBottom: '20px', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))' }}>🏆</div>
        <h2 className="mb-4" style={{ 
          fontSize: '32px', 
          fontWeight: '800', 
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.5px'
        }}>
          Xuất sắc! Phiên học hoàn tất!
        </h2>
        <p style={{ fontSize: '18px', marginBottom: '36px', opacity: 0.9 }}>
          Bạn đã ghi nhớ thành công <strong>{total}</strong> thẻ ngày hôm nay. Não bộ của bạn vừa được "nâng cấp" thêm một bậc! 🚀
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '16px',
          margin: '0 0 40px' 
        }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
             <div style={{ color: 'var(--success-color)', fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{sessionStats.easy}</div>
             <div style={{ color: 'var(--text-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: '700' }}>Rất Dễ</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
             <div style={{ color: 'var(--warning-color)', fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{sessionStats.medium}</div>
             <div style={{ color: 'var(--text-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: '700' }}>Bình Thường</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
             <div style={{ color: 'var(--danger-color)', fontSize: '32px', fontWeight: '800', marginBottom: '4px' }}>{sessionStats.hard}</div>
             <div style={{ color: 'var(--text-color)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: '700' }}>Cần Lưu Ý</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button className="btn-outline" onClick={() => navigate('/')} style={{ flex: 1, padding: '16px', fontSize: '16px' }}>Trở về Thư viện</button>
          <button className="btn-primary" onClick={() => {
              setSessionStats({ easy: 0, medium: 0, hard: 0 });
              setCurrentIndex(0);
              fetchCardsToReview(true);
          }} style={{ flex: 1, padding: '16px', fontSize: '16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}>
            Ôn luyện đợt 2 ngay
          </button>
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
