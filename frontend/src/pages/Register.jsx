import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', school: '', region: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/teacher');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page card">
      <h2>Ուսուցչի գրանցում</h2>
      <p className="muted">
        Նոր հաշիվները ստեղծվում են «Ուսուցիչ» դերով։ Դասավանդման աջակցման մասնագետի (ԱԶՂ) հաշիվը
        ստեղծում է միայն ադմինիստրատորը։
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          <span>Անուն, ազգանուն</span>
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          <span>Էլ. փոստ</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          <span>Գաղտնաբառ</span>
          <input
            type="password"
            name="password"
            minLength={6}
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          <span>Դպրոց (ոչ պարտադիր)</span>
          <input name="school" value={form.school} onChange={handleChange} />
        </label>
        <label>
          <span>Մարզ (ոչ պարտադիր)</span>
          <input name="region" value={form.region} onChange={handleChange} />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Գրանցում...' : 'Գրանցվել'}
        </button>
      </form>
      <p className="muted">
        Արդեն ունեք հաշիվ: <Link to="/login">Մուտք գործել</Link>
      </p>
    </div>
  );
}
