import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少6个字符');
      return;
    }

    if (username.length < 3) {
      setError('用户名长度至少3个字符');
      return;
    }

    setLoading(true);

    try {
      await register(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '注册失败，请重试');
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
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '18px', fontWeight: 'normal' }}>
            创建新账户
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
              用户名 (至少3个字符)
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
              minLength={3}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              密码 (至少6个字符)
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
              minLength={6}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#fff', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <Link 
            to="/login" 
            style={{ color: '#fff', fontSize: '12px', textDecoration: 'underline' }}
          >
            已有账户？立即登录
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
