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
      navigate('/'); 
    } catch (error) {
      alert('发布失败');
      console.error(error);
    }
  };

  return (
    <div style={{ maxWidth: '100%', height: '100%' }}>
      <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '12px', color: '#333' }}>
        <span style={{ marginRight: '10px' }}>文件(F)</span>
        <span style={{ marginRight: '10px' }}>编辑(E)</span>
        <span style={{ marginRight: '10px' }}>格式(O)</span>
        <span style={{ marginRight: '10px' }}>查看(V)</span>
        <span style={{ marginRight: '10px' }}>帮助(H)</span>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          className="xp-input"
          type="text" 
          placeholder="无标题 - 记事本" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          style={{ width: '100%', border: 'none', borderBottom: '1px solid #eee', fontSize: '16px', outline: 'none' }}
          required
        />
        <textarea 
          className="xp-textarea"
          placeholder="在此输入内容..."
          value={content} 
          onChange={e => setContent(e.target.value)} 
          style={{ width: '100%', minHeight: '300px', border: 'none', outline: 'none', resize: 'none', fontSize: '14px', fontFamily: 'monospace' }}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '10px', borderTop: '1px solid #eee', background: '#f5f5f5' }}>
          <button type="submit" className="xp-button">保存(S)</button>
          <button type="button" className="xp-button" onClick={() => navigate('/')}>取消</button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
