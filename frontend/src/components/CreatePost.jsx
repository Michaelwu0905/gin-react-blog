import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/posts', { title, content });
      navigate('/'); // 成功后跳转回首页
    } catch (error) {
      alert('发布失败');
      console.error(error);
    }
  };

  return (
    <div>
      <h2>发布新文章</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '400px' }}>
        <input 
          type="text" 
          placeholder="标题" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          style={{ marginBottom: '10px', padding: '8px' }}
          required
        />
        <textarea 
          placeholder="内容" 
          value={content} 
          onChange={e => setContent(e.target.value)} 
          style={{ marginBottom: '10px', padding: '8px', minHeight: '100px' }}
          required
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>提交</button>
      </form>
    </div>
  );
};

export default CreatePost;