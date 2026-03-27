import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API}${endpoint}`, formData);
      
      login(response.data.access_token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-effect-strong p-8 max-w-md w-full fade-in" data-testid="auth-container">
        <h1 className="text-4xl font-bold text-center mb-2 gradient-text">
          Ultimate Super App
        </h1>
        <p className="text-center text-gray-300 mb-8">The #1 App in the World 🚀</p>
        
        <div className="flex gap-2 mb-6">
          <button
            data-testid="login-tab"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg transition ${isLogin ? 'btn-gradient' : 'bg-gray-700'}`}
          >
            Login
          </button>
          <button
            data-testid="register-tab"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg transition ${!isLogin ? 'btn-gradient' : 'bg-gray-700'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="auth-form">
          {!isLogin && (
            <>
              <input
                data-testid="username-input"
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
                required={!isLogin}
              />
              <input
                data-testid="fullname-input"
                type="text"
                placeholder="Full Name (optional)"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
              />
            </>
          )}
          
          <input
            data-testid="email-input"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
            required
          />
          
          <input
            data-testid="password-input"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
            required
          />

          {error && (
            <div data-testid="auth-error" className="p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-200">
              {error}
            </div>
          )}

          <button
            data-testid="auth-submit-button"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg btn-gradient font-semibold disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Auth;
