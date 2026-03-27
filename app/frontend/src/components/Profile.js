import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Profile() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    setFormData({
      full_name: user.full_name || '',
      bio: user.bio || '',
      avatar_url: user.avatar_url || ''
    });
  }, [user]);

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

  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(`${API}/users/me`, formData);
      setUser(response.data);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl fade-in" data-testid="profile">
      <h1 className="text-4xl font-bold mb-8">👤 Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-effect p-8 text-center" data-testid="profile-card">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center text-5xl">
              {user.username[0].toUpperCase()}
            </div>
            <h2 className="text-2xl font-bold mb-2" data-testid="profile-username">{user.username}</h2>
            <p className="text-gray-400 mb-4" data-testid="profile-email">{user.email}</p>
            {user.full_name && (
              <p className="text-lg mb-4" data-testid="profile-fullname">{user.full_name}</p>
            )}
            {user.bio && (
              <p className="text-gray-300 mb-4" data-testid="profile-bio">{user.bio}</p>
            )}
            <button
              data-testid="edit-profile-button"
              onClick={() => setEditing(!editing)}
              className="px-6 py-2 rounded-lg btn-gradient font-semibold"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Badges */}
          <div className="glass-effect p-6 mt-6" data-testid="badges-section">
            <h3 className="text-xl font-bold mb-4">🏆 Badges</h3>
            <div className="flex flex-wrap gap-2">
              {stats?.badges && stats.badges.length > 0 ? (
                stats.badges.map((badge, index) => (
                  <span key={index} className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-sm">
                    {badge}
                  </span>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No badges yet. Keep using the app!</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Edit */}
        <div className="lg:col-span-2">
          {editing ? (
            <div className="glass-effect p-8" data-testid="edit-profile-form">
              <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
              <form onSubmit={updateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name</label>
                  <input
                    data-testid="fullname-edit-input"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Bio</label>
                  <textarea
                    data-testid="bio-edit-input"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white resize-none"
                    rows="4"
                  />
                </div>
                <button
                  data-testid="save-profile-button"
                  type="submit"
                  className="px-6 py-3 rounded-lg btn-gradient font-semibold"
                >
                  Save Changes 💾
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="glass-effect p-8 mb-6" data-testid="stats-section">
                <h2 className="text-2xl font-bold mb-6">Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center" data-testid="stat-points-detail">
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="text-3xl font-bold gradient-text">{stats?.points || 0}</div>
                    <div className="text-gray-400 text-sm">Points</div>
                  </div>
                  <div className="text-center" data-testid="stat-followers-detail">
                    <div className="text-4xl mb-2">👥</div>
                    <div className="text-3xl font-bold gradient-text-2">{stats?.followers || 0}</div>
                    <div className="text-gray-400 text-sm">Followers</div>
                  </div>
                  <div className="text-center" data-testid="stat-following-detail">
                    <div className="text-4xl mb-2">🤝</div>
                    <div className="text-3xl font-bold gradient-text">{stats?.following || 0}</div>
                    <div className="text-gray-400 text-sm">Following</div>
                  </div>
                  <div className="text-center" data-testid="stat-posts-detail">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-3xl font-bold gradient-text-2">{stats?.posts_count || 0}</div>
                    <div className="text-gray-400 text-sm">Posts</div>
                  </div>
                  <div className="text-center" data-testid="stat-likes-detail">
                    <div className="text-4xl mb-2">❤️</div>
                    <div className="text-3xl font-bold gradient-text">{stats?.total_likes || 0}</div>
                    <div className="text-gray-400 text-sm">Total Likes</div>
                  </div>
                  <div className="text-center" data-testid="stat-notes-detail">
                    <div className="text-4xl mb-2">📝</div>
                    <div className="text-3xl font-bold gradient-text-2">{stats?.notes_count || 0}</div>
                    <div className="text-gray-400 text-sm">Notes</div>
                  </div>
                  <div className="text-center" data-testid="stat-tasks-detail">
                    <div className="text-4xl mb-2">✅</div>
                    <div className="text-3xl font-bold gradient-text">{stats?.tasks_completed || 0}</div>
                    <div className="text-gray-400 text-sm">Tasks Done</div>
                  </div>
                  <div className="text-center" data-testid="stat-products-detail">
                    <div className="text-4xl mb-2">📦</div>
                    <div className="text-3xl font-bold gradient-text-2">{stats?.products_count || 0}</div>
                    <div className="text-gray-400 text-sm">Products</div>
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="glass-effect p-8" data-testid="activity-summary">
                <h2 className="text-2xl font-bold mb-6">Activity Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-lg bg-gray-800">
                    <span className="text-gray-300">Member Since</span>
                    <span className="font-semibold">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-lg bg-gray-800">
                    <span className="text-gray-300">Role</span>
                    <span className="font-semibold uppercase gradient-text">{user.role}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
