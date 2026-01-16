import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/client';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    apiClient.get(`/posts/${id}`)
      .then(res => setPost(res.data.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!post) return <div>加载中...</div>;

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  );
};

export default PostDetail;