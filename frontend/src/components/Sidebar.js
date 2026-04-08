import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Home, 
  Folder, 
  Users, 
  Bell, 
  Plus, 
  Search, 
  Menu, 
  BookOpen, 
  LogOut, 
  Layers
} from 'lucide-react';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const menuItems = [
    { name: 'Trang chủ', icon: Home, path: '/' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleNavigateCreate = () => {
    navigate('/deck/create');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <button className="icon-btn hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        {isOpen && (
          <h1 className="logo sidebar-logo" onClick={() => navigate('/')}>
            <BookOpen style={{ display: 'inline', marginRight: '6px' }}/> 
            Flashcard
          </h1>
        )}
      </div>

      <nav className="sidebar-nav" style={{ marginTop: '20px' }}>
        <ul>
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <button 
                className={`nav-btn ${location.pathname === item.path && item.path === '/' ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
                title={!isOpen ? item.name : ""}
              >
                <div className="nav-icon-wrapper">
                  <item.icon size={22} />
                  {item.notify && <span className="notify-badge">{item.notify}</span>}
                </div>
                {isOpen && (
                  <span className="nav-text">
                    {item.name}
                    {item.badge && <span className="new-badge">{item.badge}</span>}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-divider"></div>

        {isOpen && <div className="sidebar-headline">Thư mục</div>}
        
        <ul>
          <li>
            <button className="nav-btn create-btn" onClick={handleNavigateCreate} title={!isOpen ? "Thư mục mới" : ""}>
              <div className="nav-icon-wrapper">
                <Plus size={22} />
              </div>
              {isOpen && <span className="nav-text">Thư mục mới</span>}
            </button>
          </li>
        </ul>
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-divider"></div>
          {isOpen ? (
            <div className="user-profile">
              <div className="user-stats">
                 <div className="stat-badge" title="Chuỗi ngày học liên tục">
                    <span className="fire-icon">🔥</span>
                    <span>{user.streak || 0}</span>
                 </div>
                 <div className="stat-badge" title="Điểm Kinh Nghiệm">
                    <span className="xp-icon">⚡</span>
                    <span>{user.xp || 0} XP</span>
                 </div>
              </div>
              <div className="user-info">
                <strong style={{ fontSize: '15px' }}>{user.username}</strong>
                <button className="icon-btn" onClick={logout} title="Đăng xuất" style={{ color: 'var(--danger-color)' }}>
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
             <button className="icon-btn logout-only-btn" onClick={logout} title="Đăng xuất" style={{ margin: '0 auto', color: 'var(--danger-color)' }}>
                <LogOut size={22} />
             </button>
          )}
        </div>
      )}
    </aside>
  );
}
