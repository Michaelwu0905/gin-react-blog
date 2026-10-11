import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './authContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 初始化时检查 token 是否有效
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await apiClient.get('/auth/me');
          setUser(response.data.user);
          setToken(savedToken);
        } catch {
          // Token 无效，清除
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // 登录
  const login = async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    return response.data;
  };

  // 注册
  const register = async (username, password) => {
    const response = await apiClient.post('/auth/register', { username, password });
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    return response.data;
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // 检查是否是管理员
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  // 检查是否可以编辑文章
  const canEditPost = (post) => {
    if (!user) return false;
    return user.id === post.author_id || user.role === 'admin';
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin,
    canEditPost,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
