import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/analytics/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 fade-in" data-testid="dashboard">
      <h1 className="text-4xl font-bold mb-2">Welcome back, <span className="gradient-text">{user.username}</span>! 👋</h1>
      <p className="text-gray-400 mb-8">Your all-in-one super app dashboard</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-effect p-6 card-hover" data-testid="stat-points">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-3xl font-bold gradient-text">{stats?.points || 0}</div>
          <div className="text-gray-400">Points</div>
        </div>
        
        <div className="glass-effect p-6 card-hover" data-testid="stat-followers">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-3xl font-bold gradient-text-2">{stats?.followers || 0}</div>
          <div className="text-gray-400">Followers</div>
        </div>
        
        <div className="glass-effect p-6 card-hover" data-testid="stat-posts">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-3xl font-bold gradient-text">{stats?.posts_count || 0}</div>
          <div className="text-gray-400">Posts</div>
        </div>
        
        <div className="glass-effect p-6 card-hover" data-testid="stat-tasks">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold gradient-text-2">{stats?.tasks_completed || 0}</div>
          <div className="text-gray-400">Tasks Done</div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/social" className="glass-effect p-6 card-hover block" data-testid="quick-action-social">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-xl font-bold mb-2">Social Feed</h3>
          <p className="text-gray-400">Share your thoughts and connect with others</p>
        </a>
        
        <a href="/ai" className="glass-effect p-6 card-hover block" data-testid="quick-action-ai">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-xl font-bold mb-2">AI Hub</h3>
          <p className="text-gray-400">Generate text and images with AI</p>
        </a>
        
        <a href="/marketplace" className="glass-effect p-6 card-hover block" data-testid="quick-action-shop">
          <div className="text-4xl mb-3">🛒</div>
          <h3 className="text-xl font-bold mb-2">Marketplace</h3>
          <p className="text-gray-400">Buy and sell amazing products</p>
        </a>
        
        <a href="/productivity" className="glass-effect p-6 card-hover block" data-testid="quick-action-tasks">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="text-xl font-bold mb-2">Productivity</h3>
          <p className="text-gray-400">Manage your notes and tasks</p>
        </a>
        
        <a href="/messages" className="glass-effect p-6 card-hover block" data-testid="quick-action-messages">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-xl font-bold mb-2">Messages</h3>
          <p className="text-gray-400">Chat with your connections</p>
        </a>
        
        <a href="/profile" className="glass-effect p-6 card-hover block" data-testid="quick-action-profile">
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-xl font-bold mb-2">Profile</h3>
          <p className="text-gray-400">View and edit your profile</p>
        </a>
      </div>
    </div>
  );
}

export default Dashboard;
