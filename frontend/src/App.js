import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import DeckList from './components/DeckList';
import CardManager from './components/CardManager';
import StudyMode from './components/StudyMode';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateDeck from './pages/CreateDeck';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Sun, Moon, BookOpen, LogOut, User } from 'lucide-react';
import './index.css';
import Sidebar from './components/Sidebar';

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('dark'); // Default to dark for Quizlet feel
  const location = useLocation();
  const hideSidebar = location.pathname === '/login' || location.pathname === '/register';
  
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="app-layout">
      {!hideSidebar && <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />}
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button className="btn-outline" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
        </div>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><DeckList /></ProtectedRoute>} />
          <Route path="/deck/create" element={<ProtectedRoute><CreateDeck /></ProtectedRoute>} />
          <Route path="/deck/:deckId/cards" element={<ProtectedRoute><CardManager /></ProtectedRoute>} />
          <Route path="/study/:deckId" element={<ProtectedRoute><StudyMode /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}



function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
