import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send } from 'lucide-react';
import { API_URL } from '../config';

const AiChatbox = ({ currentCard }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Chào bạn! Mình là AI Tutor. Mình có thể giúp gì cho thẻ từ vựng này không?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Optionally reset chat when card changes
  useEffect(() => {
    if (isOpen && currentCard) {
        setMessages([
          { sender: 'bot', text: `Chào bạn! Mình là AI Tutor. Bạn muốn tìm hiểu thêm về từ "${currentCard.question}" không?` }
        ]);
    }
  }, [currentCard, isOpen]);

  const sendMessage = async (text, action = null) => {
    if (!text.trim() && !action) return;
    
    // Add user message
    const userMessage = text || `Yêu cầu: ${action}`;
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          word: currentCard?.question,
          context: currentCard?.answer,
          message: text,
          action: action // e.g., 'explain', 'examples', 'synonyms'
        })
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, AI đang bận. Vui lòng thử lại sau!' }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Lỗi kết nối đến máy chủ AI.' }]);
    }
    setLoading(false);
  };

  const handlePreset = (actionType, label) => {
    sendMessage(label, actionType);
  };

  return (
    <>
      {/* Floating Button */}
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

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '350px',
          height: '500px',
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
            background: 'var(--primary-color)',
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
            gap: '12px'
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                {msg.sender === 'bot' && <div style={{ padding: '6px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', color: 'var(--primary-color)' }}><Bot size={16} /></div>}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '16px',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary-color)' : 'var(--bg-color)',
                  color: msg.sender === 'user' ? '#fff' : 'var(--text-color)',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  border: msg.sender === 'bot' ? '1px solid var(--border-color)' : 'none',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px' }}>
                 <div style={{ padding: '6px', background: 'rgba(99,102,241,0.1)', borderRadius: '50%', color: 'var(--primary-color)' }}><Bot size={16} /></div>
                 <div style={{ padding: '10px 14px', borderRadius: '16px', backgroundColor: 'var(--bg-color)', fontSize: '14px', fontStyle: 'italic', opacity: 0.7 }}>
                    AI đang suy nghĩ...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions (If relevant to a card) */}
          {currentCard && (
            <div style={{
              padding: '10px 16px',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              borderTop: '1px solid var(--border-color)',
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none',  // IE and Edge
            }}>
              <button 
                className="btn-outline" 
                style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'nowrap', borderRadius: '8px', flexShrink: 0 }} 
                onClick={() => handlePreset('explain', 'Giải thích từ này')}
              >
                Giải thích
              </button>
              <button 
                className="btn-outline" 
                style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'nowrap', borderRadius: '8px', flexShrink: 0 }} 
                onClick={() => handlePreset('examples', 'Lấy 3 ví dụ câu')}
              >
                Lấy 3 ví dụ câu
              </button>
              <button 
                className="btn-outline" 
                style={{ fontSize: '12px', padding: '6px 10px', whiteSpace: 'nowrap', borderRadius: '8px', flexShrink: 0 }} 
                onClick={() => handlePreset('synonyms', 'Từ đồng nghĩa')}
              >
                Từ đồng nghĩa
              </button>
            </div>
          )}

          {/* Input Area */}
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
    </>
  );
};

export default AiChatbox;
