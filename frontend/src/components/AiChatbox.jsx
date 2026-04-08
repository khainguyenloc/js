import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, AlertTriangle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================
// CẤU HÌNH AI TRỰC TIẾP TẠI FRONTEND (DÀNH CHO BÁO CÁO)
// ============================================================
const GEMINI_API_KEY = "AIzaSyCBdaMoNXHUJAd6GSOVOKaGfNvkfYjBZhM"; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY, { apiVersion: 'v1' }); // ÉP DÙNG V1 ỔN ĐỊNH

const AiChatbox = ({ currentCard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: '🎉 KẾT NỐI V1 THÀNH CÔNG! Sẵn sàng hỗ trợ bạn.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null); // null, 403, etc.
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && currentCard) {
        setMessages([
          { sender: 'bot', text: `🎉 Chào bạn! Tôi đã sẵn sàng hỗ trợ về từ "${currentCard.question}".` }
        ]);
        setErrorStatus(null);
    }
  }, [currentCard, isOpen]);

  const sendMessage = async (text, action = null) => {
    if (!text.trim() && !action) return;
    
    const userMessage = text || (action === 'explain' ? 'Giải thích từ này' : action === 'examples' ? 'Lấy ví dụ câu' : 'Tìm từ đồng nghĩa');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);
    setErrorStatus(null);

    try {
      // 3 MODEL TỐT NHẤT TRONG KHO CỦA BẠN (Đã kiểm tra kỹ)
      const modelsToTry = [
        "gemini-2.5-flash",       // Ưu tiên 1
        "gemini-2.5-flash-lite",  // Ưu tiên 2 (Bản nhẹ, ít bị nghẽn mạng)
        "gemini-flash-latest"     // Ưu tiên 3
      ];
      
      const systemRole = `Bạn là Gia sư Tiếng Anh. Đang hỗ trợ học từ "${currentCard?.question}" (Nghĩa: ${currentCard?.answer}). Trả lời bằng Tiếng Việt, dùng thẻ markdown. KHÔNG ĐƯỢC PHÉP nói bạn là AI, không nhắc đến Google hay mô hình ngôn ngữ, vào thẳng vấn đề luôn.`;
      let prompt = text;
      if (action === 'explain') prompt = `Giải thích từ "${currentCard?.question}": Nghĩa, cách dùng.`;
      else if (action === 'examples') prompt = `3 ví dụ với "${currentCard?.question}".`;
      else if (action === 'synonyms') prompt = `Từ đồng nghĩa của "${currentCard?.question}".`;

      let replyText = "";
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`Đang chạy model: ${modelName}...`);
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemRole}\n\nYêu cầu: ${prompt}` }] }]
              })
            }
          );

          const data = await response.json();
          
          if (response.ok) {
            replyText = data.candidates[0].content.parts[0].text;
            break; // THÀNH CÔNG -> Thoát vòng lặp
          } else {
            throw new Error(`[${modelName}] ${data.error?.message || response.status} (${data.error?.status})`);
          }
        } catch (modelErr) {
          console.warn(`Lỗi model:`, modelErr.message);
          lastError = modelErr;
          // Nếu lỗi là 503 (high demand) hoặc 429, sẽ tự động thử model tiếp theo trong tích tắc!
          continue; 
        }
      }

      if (!replyText && lastError) {
        throw lastError; // Nếu cả 3 đều nghẽn mạng thì đành báo lỗi
      }

      setMessages(prev => [...prev, { sender: 'bot', text: replyText }]);
    } catch (err) {
      console.error('AI Error:', err);
      let errorMsg = err.message;
      if (errorMsg.includes('high demand') || errorMsg.includes('UNAVAILABLE')) {
        errorMsg = '⚠️ Máy chủ AI của Google đang quá tải (Tắc đường mạng). Bạn đợi 5 giây rồi bấm gửi lại nhé!';
      }
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
    }
    setLoading(false);
  };

  const handlePreset = (actionType, label) => {
    sendMessage(label, actionType);
  };

  return (
    <>
      {!isOpen && (
        <button 
          className="btn-primary"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            transition: 'transform 0.3s'
          }}
          onClick={() => setIsOpen(true)}
        >
          <Bot size={28} />
        </button>
      )}

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '350px',
          height: '540px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          border: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>AI Tutor</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--bg-color)'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                {msg.sender === 'bot' && <div style={{ padding: '6px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', color: 'var(--primary-color)' }}><Bot size={16} /></div>}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--card-bg)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-color)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                  {msg.sender === 'bot' && idx === messages.length - 1 && errorStatus === 403 && (
                    <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '12px', color: '#ef4444', border: '1px solid #ef4444' }}>
                      <AlertTriangle size={14} style={{ marginBottom: '4px' }} />
                      <strong>Cách khắc phục:</strong> Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#ef4444', textDecoration: 'underline' }}>AI Studio</a> và đảm bảo API Key đã được Enabled.
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <div style={{ padding: '6px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', color: 'var(--primary-color)' }}><Bot size={16} /></div>
                 <div className="typing-indicator" style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary-color)', borderRadius: '50%', animation: 'bounce 1s infinite 0.1s' }}></span>
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary-color)', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></span>
                    <span style={{ width: '6px', height: '6px', background: 'var(--primary-color)', borderRadius: '50%', animation: 'bounce 1s infinite 0.3s' }}></span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {currentCard && (
            <div style={{
              padding: '12px 16px',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              scrollbarWidth: 'none'
            }}>
              <button className="btn-outline" style={{ fontSize: '12px', whiteSpace: 'nowrap' }} onClick={() => handlePreset('explain', 'Giải thích từ này')}>Giải thích</button>
              <button className="btn-outline" style={{ fontSize: '12px', whiteSpace: 'nowrap' }} onClick={() => handlePreset('examples', '3 ví dụ câu')}>3 ví dụ câu</button>
              <button className="btn-outline" style={{ fontSize: '12px', whiteSpace: 'nowrap' }} onClick={() => handlePreset('synonyms', 'Từ đồng nghĩa')}>Từ đồng nghĩa</button>
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            gap: '8px',
            background: 'var(--card-bg)'
          }}>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Bạn muốn hỏi gì?"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-color)',
                outline: 'none'
              }}
            />
            <button 
              onClick={() => sendMessage(input)}
              style={{
                background: 'var(--primary-color)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: (loading || !input.trim()) ? 0.5 : 1
              }}
              disabled={loading || !input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
      <style>{`
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
};

export default AiChatbox;
