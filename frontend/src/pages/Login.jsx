import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  teacher: 'ուսուցիչ',
  ldm: 'դասավանդման աջակցման մասնագետ',
  admin: 'ադմինիստրատոր',
};

export default function Login() {
  const { login, loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expectedRole = searchParams.get('role') || '';
  const next = searchParams.get('next') || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    // Already logged in with a matching role for this entry point — skip the form.
    if (user && (!expectedRole || user.role === expectedRole || user.role === 'admin')) {
      navigate(next, { replace: true });
    }
  }, [user, expectedRole, next, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const loggedInUser = await login(form.email, form.password);
      if (expectedRole && loggedInUser.role !== expectedRole && loggedInUser.role !== 'admin') {
        logout();
        setError(
          `Այս հաշիվը գրանցված է որպես «${ROLE_LABELS[loggedInUser.role] || loggedInUser.role}», ոչ թե «${
            ROLE_LABELS[expectedRole] || expectedRole
          }»։ Խնդրում ենք մուտք գործել ճիշտ բաժնից։`
        );
        return;
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  if (user && expectedRole && user.role !== expectedRole && user.role !== 'admin') {
    return (
      <div className="auth-page card">
        <h2>Մուտք գործել</h2>
        <p className="muted">
          Դուք արդեն մուտք եք գործել որպես «{ROLE_LABELS[user.role] || user.role}»։ Այս բաժինը
          նախատեսված է «{ROLE_LABELS[expectedRole] || expectedRole}» դերի համար։
        </p>
        <button type="button" onClick={() => logout()}>
          Դուրս գալ և մուտք գործել այլ հաշվով
        </button>
      </div>
    );
  }

  return (
    <div className="auth-page card">
      <h2>Մուտք գործել{expectedRole ? ` — ${ROLE_LABELS[expectedRole] || expectedRole}` : ''}</h2>
      <form onSubmit={handleSubmit}>
        <label>
          <span>Էլ. փոստ</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          <span>Գաղտնաբառ</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Մուտք...' : 'Մուտք գործել'}
        </button>
      </form>
      {(!expectedRole || expectedRole === 'teacher') && (
        <p className="muted">
          Դեռ հաշիվ չունեք: <Link to="/register">Գրանցվել որպես ուսուցիչ</Link>
        </p>
      )}
      <p className="muted">
        <Link to="/">← Վերադառնալ գլխավոր էջ</Link>
      </p>
    </div>
  );
}
