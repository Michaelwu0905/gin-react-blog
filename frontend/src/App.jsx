import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PostList from './components/PostList';
import CreatePost from './components/CreatePost';
import PostDetail from './components/PostDetail';
import EditPost from './components/EditPost';
import Login from './components/Login';
import Register from './components/Register';

// 需要登录才能访问的路由
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: '20px' }}>加载中...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMaximized, setIsMaximized] = useState(false);
  
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };
  
  const getTitle = () => {
    if (location.pathname === '/') return '我的博客 - 资源管理器';
    if (location.pathname === '/create') return '发布文章 - 记事本';
    if (location.pathname === '/login') return '用户登录 - Windows 安全';
    if (location.pathname === '/register') return '用户注册 - Windows 安全';
    if (location.pathname.startsWith('/posts/') && location.pathname.includes('/edit')) return '编辑文章 - 记事本';
    if (location.pathname.startsWith('/posts/')) return '阅读文章 - Internet Explorer';
    return '我的博客';
  };

  return (
    <>
      <div className={`xp-window ${isMaximized ? 'maximized' : ''}`}>
        <div className="xp-title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '14px' }}>📂</span>
            <span>{getTitle()}</span>
          </div>
          <div className="xp-title-controls">
            <div className="xp-title-btn xp-btn-min">_</div>
            <div 
              className="xp-title-btn xp-btn-max" 
              onClick={toggleMaximize}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {isMaximized ? '❐' : '□'}
            </div>
            <div className="xp-title-btn xp-btn-close">×</div>
          </div>
        </div>
        <div className="xp-window-body">
          {children}
        </div>
      </div>

      <nav className="xp-taskbar">
        <Link to="/" className="xp-start-button" style={{ textDecoration: 'none' }}>
          <span style={{ marginRight: '4px' }}>⊞</span>
          <span>start</span>
        </Link>
        <div className="xp-task-items">
          <Link to="/" className={`xp-task-item ${location.pathname === '/' ? 'active' : ''}`}>
            首页
          </Link>
          {isAuthenticated && (
            <Link to="/create" className={`xp-task-item ${location.pathname === '/create' ? 'active' : ''}`}>
              发布文章
            </Link>
          )}
        </div>
        <div className="xp-system-tray" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAuthenticated ? (
            <>
              <span style={{ fontSize: '11px' }}>
                👤 {user?.username}
                {user?.role === 'admin' && <span style={{ color: '#ff6600', marginLeft: '4px' }}>[管理员]</span>}
              </span>
              <button 
                onClick={logout}
                className="xp-button"
                style={{ padding: '2px 8px', fontSize: '11px' }}
              >
                登出
              </button>
            </>
          ) : (
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', fontSize: '11px' }}>
              登录
            </Link>
          )}
          <span style={{ borderLeft: '1px solid #555', paddingLeft: '10px' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </nav>
    </>
  );
};

function AppContent() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/posts/:id/edit" element={
            <ProtectedRoute>
              <EditPost />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
