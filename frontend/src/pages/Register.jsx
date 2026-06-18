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
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page card">
      <h2>Create a teacher account</h2>
      <p className="muted">
        New accounts start as a Teacher. An admin can promote you to LDM or Admin later.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          <span>Full name</span>
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          <span>Email</span>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          <span>Password</span>
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
          <span>School (optional)</span>
          <input name="school" value={form.school} onChange={handleChange} />
        </label>
        <label>
          <span>Region (optional)</span>
          <input name="region" value={form.region} onChange={handleChange} />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
