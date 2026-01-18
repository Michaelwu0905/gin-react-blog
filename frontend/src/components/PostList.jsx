import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    apiClient.get('/posts')
      .then(response => {
        setPosts(response.data.data || []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching posts:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '20px' }}>正在搜索文章...</div>;

  return (
    <div className="explorer-view">
      <div className="explorer-toolbar" style={{ borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '15px', display: 'flex', gap: '15px', fontSize: '12px', color: '#666' }}>
        <span>文件(F)</span>
        <span>编辑(E)</span>
        <span>查看(V)</span>
        <span>收藏(A)</span>
        <span>帮助(H)</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
        {posts.map(post => (
          <Link 
            key={post.id} 
            to={`/posts/${post.id}`} 
            style={{ 
              textDecoration: 'none', 
              color: 'black', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '8px',
              border: '1px solid transparent'
            }}
            className="post-item-icon"
          >
            <div style={{ fontSize: '40px', marginBottom: '5px' }}>📄</div>
            <div style={{ fontSize: '11px', textAlign: 'center', wordBreak: 'break-all', maxHeight: '2.4em', overflow: 'hidden' }}>
              {post.title}
            </div>
            {post.author && (
              <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                by {post.author.username}
              </div>
            )}
          </Link>
        ))}
        
        {isAuthenticated && (
          <Link 
            to="/create" 
            style={{ 
              textDecoration: 'none', 
              color: 'black', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              padding: '8px',
              border: '1px solid transparent'
            }}
            className="post-item-icon"
          >
            <div style={{ fontSize: '40px', marginBottom: '5px' }}>📝</div>
            <div style={{ fontSize: '11px', textAlign: 'center' }}>新建文章.txt</div>
          </Link>
        )}
      </div>

      {posts.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
          <p>暂无文章</p>
          {isAuthenticated ? (
            <Link to="/create" style={{ color: '#0066cc' }}>创建第一篇文章</Link>
          ) : (
            <Link to="/login" style={{ color: '#0066cc' }}>登录后发布文章</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default PostList;
