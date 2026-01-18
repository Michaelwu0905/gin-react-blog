import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdPreview } from 'md-editor-rt';
import 'md-editor-rt/lib/preview.css';
import apiClient from '../api/client';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get(`/posts/${id}`)
      .then(res => setPost(res.data.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!post) return <div style={{ padding: '20px' }}>正在从服务器获取数据...</div>;

  return (
    <div style={{ background: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="ie-toolbar" style={{ background: '#f0f0f0', padding: '5px', borderBottom: '1px solid #ccc', display: 'flex', gap: '10px', fontSize: '11px' }}>
        <button className="xp-button" onClick={() => navigate('/')} style={{ padding: '2px 8px' }}>← 后退</button>
        <button className="xp-button" style={{ padding: '2px 8px' }}>前进 →</button>
        <div style={{ width: '1px', background: '#ccc', margin: '0 5px' }}></div>
        <button className="xp-button" style={{ padding: '2px 8px' }}>停止</button>
        <button className="xp-button" style={{ padding: '2px 8px' }}>刷新</button>
        <button className="xp-button" style={{ padding: '2px 8px' }}>主页</button>
      </div>
      
      <div className="ie-address-bar" style={{ background: '#f0f0f0', padding: '5px 10px', borderBottom: '1px solid #7f9db9', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '12px', color: '#333' }}>地址(D)</div>
        <div style={{ flex: 1, background: '#fff', border: '1px solid #7f9db9', padding: '2px 5px', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '5px' }}>🌐</span>
          http://blog.windows.xp/posts/{id}
        </div>
        <button className="xp-button" style={{ padding: '1px 5px', fontSize: '11px' }}>转到</button>
      </div>
      
      <div className="ie-content" style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
        <h1 style={{ color: '#003399', fontSize: '24px', marginBottom: '10px', fontFamily: 'serif' }}>{post.title}</h1>
        <div style={{ color: '#666', fontSize: '11px', marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
          发布时间: {new Date(post.created_at).toLocaleString()} | 归档: 我的文档
        </div>
        <div className="markdown-body">
          <MdPreview
            modelValue={post.content}
            language="zh-CN"
          />
        </div>
        
        <div style={{ marginTop: '50px', textAlign: 'center' }}>
          <hr style={{ border: '0', borderTop: '1px solid #eee' }} />
          <p style={{ fontSize: '11px', color: '#999' }}>© 2026 Microsoft Blog. 保留所有权利。</p>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
