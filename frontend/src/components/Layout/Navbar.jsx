import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS_BY_ROLE = {
  teacher: [{ to: '/', label: 'My Reflections' }],
  ldm: [
    { to: '/', label: 'Observations' },
    { to: '/ldm/competency', label: 'Competency Matrix' },
    { to: '/ldm/ai-diary', label: 'AI Diary' },
  ],
  admin: [
    { to: '/', label: 'Observations' },
    { to: '/ldm/competency', label: 'Competency Matrix' },
    { to: '/ldm/ai-diary', label: 'AI Diary' },
    { to: '/admin/users', label: 'User Management' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Teacher Efficancy Tool</div>
      <div className="navbar-links">
        {(LINKS_BY_ROLE[user.role] || []).map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </div>
      <div className="navbar-user">
        <span>
          {user.name} <em>({user.role})</em>
        </span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
