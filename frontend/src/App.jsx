import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import PostList from './components/PostList';
import CreatePost from './components/CreatePost';
import PostDetail from './components/PostDetail';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const getTitle = () => {
    if (location.pathname === '/') return '我的博客 - 资源管理器';
    if (location.pathname === '/create') return '发布文章 - 记事本';
    if (location.pathname.startsWith('/posts/')) return '阅读文章 - Internet Explorer';
    return '我的博客';
  };

  return (
    <>
      <div className="xp-window">
        <div className="xp-title-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '14px' }}>📂</span>
            <span>{getTitle()}</span>
          </div>
          <div className="xp-title-controls">
            <div className="xp-title-btn xp-btn-min">_</div>
            <div className="xp-title-btn xp-btn-max">□</div>
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
          <Link to="/create" className={`xp-task-item ${location.pathname === '/create' ? 'active' : ''}`}>
            发布文章
          </Link>
        </div>
        <div className="xp-system-tray">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </nav>
    </>
  );
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
