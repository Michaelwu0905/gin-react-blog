import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/posts')
      .then(response => {
        // 根据后端结构，数据在 response.data.data
        setPosts(response.data.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching posts:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>最新文章</h2>
      {posts.map(post => (
        <div key={post.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
          <h3>
            <Link to={`/posts/${post.id}`}>{post.title}</Link>
          </h3>
          <p style={{ color: '#666', fontSize: '12px' }}>
            发布于: {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PostList;