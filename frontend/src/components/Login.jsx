import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #0a246a 0%, #0a246a 30%, #a6caf0 100%)',
        padding: '30px 40px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '350px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>👤</div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 'normal' }}>
            欢迎使用
          </h2>
        </div>

        {error && (
          <div style={{ 
            background: '#ffdddd', 
            color: '#cc0000', 
            padding: '8px 12px', 
            marginBottom: '15px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="xp-input"
              style={{ 
                width: '100%', 
                padding: '6px 8px',
                border: '1px solid #7f9db9',
                borderRadius: '2px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="xp-input"
              style={{ 
                width: '100%', 
                padding: '6px 8px',
                border: '1px solid #7f9db9',
                borderRadius: '2px'
              }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="xp-button"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '8px',
              marginBottom: '10px'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <Link 
            to="/register" 
            style={{ color: '#fff', fontSize: '12px', textDecoration: 'underline' }}
          >
            没有账户？立即注册
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
