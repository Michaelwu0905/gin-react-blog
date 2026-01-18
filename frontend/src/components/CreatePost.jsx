import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import apiClient, { uploadImage } from '../api/client';

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

  // 处理图片上传
  const handleUploadImg = async (files, callback) => {
    const urls = await Promise.all(
      files.map(async (file) => {
        try {
          const url = await uploadImage(file);
          return url;
        } catch (error) {
          console.error('图片上传失败:', error);
          return null;
        }
      })
    );
    // 过滤掉上传失败的图片，并调用回调插入图片
    callback(urls.filter(url => url !== null));
  };

  return (
    <div style={{ maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '12px', color: '#333' }}>
        <span style={{ marginRight: '10px' }}>文件(F)</span>
        <span style={{ marginRight: '10px' }}>编辑(E)</span>
        <span style={{ marginRight: '10px' }}>格式(O)</span>
        <span style={{ marginRight: '10px' }}>查看(V)</span>
        <span style={{ marginRight: '10px' }}>帮助(H)</span>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <input 
          className="xp-input"
          type="text" 
          placeholder="请输入文章标题..." 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          style={{ 
            width: '100%', 
            border: 'none', 
            borderBottom: '1px solid #eee', 
            fontSize: '16px', 
            outline: 'none',
            padding: '10px 0',
            marginBottom: '10px'
          }}
          required
        />
        <div style={{ flex: 1, minHeight: '400px' }}>
          <MdEditor
            modelValue={content}
            onChange={setContent}
            onUploadImg={handleUploadImg}
            language="zh-CN"
            placeholder="在此输入 Markdown 内容..."
            style={{ height: '100%' }}
            toolbars={[
              'bold', 'underline', 'italic', 'strikeThrough',
              '-',
              'title', 'sub', 'sup', 'quote',
              '-',
              'unorderedList', 'orderedList', 'task',
              '-',
              'codeRow', 'code', 'link', 'image', 'table',
              '-',
              'revoke', 'next',
              '=',
              'preview', 'htmlPreview', 'catalog'
            ]}
          />
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '10px', 
          padding: '10px', 
          borderTop: '1px solid #eee', 
          background: '#f5f5f5',
          marginTop: '10px'
        }}>
          <button type="submit" className="xp-button">保存(S)</button>
          <button type="button" className="xp-button" onClick={() => navigate('/')}>取消</button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
