import { Link } from 'react-router-dom';
import { useAuth } from '../App';

function Navigation() {
  const { logout } = useAuth();

  return (
    <nav className="glass-effect-strong sticky top-0 z-50" data-testid="navigation">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold gradient-text" data-testid="nav-logo">
            🚀 SuperApp
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-purple-400 transition" data-testid="nav-dashboard">Dashboard</Link>
            <Link to="/social" className="hover:text-purple-400 transition" data-testid="nav-social">Social</Link>
            <Link to="/ai" className="hover:text-purple-400 transition" data-testid="nav-ai">AI Hub</Link>
            <Link to="/marketplace" className="hover:text-purple-400 transition" data-testid="nav-marketplace">Shop</Link>
            <Link to="/productivity" className="hover:text-purple-400 transition" data-testid="nav-productivity">Tasks</Link>
            <Link to="/messages" className="hover:text-purple-400 transition" data-testid="nav-messages">Messages</Link>
            <Link to="/profile" className="hover:text-purple-400 transition" data-testid="nav-profile">Profile</Link>
            <button
              data-testid="logout-button"
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;

