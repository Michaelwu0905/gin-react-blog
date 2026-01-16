import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PostList from './components/PostList';
import CreatePost from './components/CreatePost';
import PostDetail from './components/PostDetail';

function App() {
  return (
    <Router>
      <div className="container" style={{ padding: '20px', fontFamily: 'Arial' }}>
        <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
          <Link to="/" style={{ marginRight: '15px', fontWeight: 'bold' }}>首页</Link>
          <Link to="/create">发布文章</Link>
        </nav>

        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/create" element={<CreatePost />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;