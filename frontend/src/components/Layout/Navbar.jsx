import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS_BY_ROLE = {
  teacher: [{ to: '/teacher', label: 'Իմ ինքնավերլուծությունը' }],
  ldm: [
    { to: '/ldm/observations', label: 'Դասի գնահատում' },
    { to: '/ldm/competency', label: 'Կարողունակությունների մատրիցա' },
    { to: '/ldm/chat', label: 'Դրսևորումների չատ (AI)' },
    { to: '/ldm/ai-diary', label: 'AI օրագիր' },
  ],
  admin: [
    { to: '/ldm/observations', label: 'Դասի գնահատում' },
    { to: '/ldm/competency', label: 'Կարողունակությունների մատրիցա' },
    { to: '/ldm/chat', label: 'Դրսևորումների չատ (AI)' },
    { to: '/ldm/ai-diary', label: 'AI օրագիր' },
    { to: '/admin/users', label: 'Օգտատերերի կառավարում' },
  ],
};

const ROLE_LABELS = { teacher: 'ուսուցիչ', ldm: 'մասնագետ', admin: 'ադմին' };

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
      <Link to="/dashboard" className="navbar-brand">
        Ուսուցչի Զարգացման Հարթակ
      </Link>
      <div className="navbar-links">
        {(LINKS_BY_ROLE[user.role] || []).map((link) => (
          <Link key={link.to} to={link.to}>
            {link.label}
          </Link>
        ))}
      </div>
      <div className="navbar-user">
        <span>
          {user.name} <em>({ROLE_LABELS[user.role] || user.role})</em>
        </span>
        <button onClick={handleLogout}>Դուրս գալ</button>
      </div>
    </nav>
  );
}
