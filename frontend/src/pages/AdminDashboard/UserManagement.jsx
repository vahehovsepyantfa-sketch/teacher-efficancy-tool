import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const ROLES = ['teacher', 'ldm', 'admin'];
const emptyForm = { name: '', email: '', password: '', role: 'teacher', school: '', region: '' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    const { data } = await axiosClient.get('/admin/users');
    setUsers(data.users);
  };

  useEffect(() => {
    loadUsers().catch(() => setError('Failed to load users'));
  }, []);

  const ldms = users.filter((u) => u.role === 'ldm');

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/admin/users', form);
      setForm(emptyForm);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, patch) => {
    try {
      await axiosClient.patch(`/admin/users/${id}`, patch);
      await loadUsers();
    } catch {
      setError('Failed to update user');
    }
  };

  const deactivateUser = async (id) => {
    try {
      await axiosClient.delete(`/admin/users/${id}`);
      await loadUsers();
    } catch {
      setError('Failed to deactivate user');
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Create user</h2>
        <form onSubmit={handleCreate}>
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Temporary password</span>
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Role</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>All users</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned LDM</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => updateUser(u._id, { role: e.target.value })}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  {u.role === 'teacher' ? (
                    <select
                      value={u.assignedLdm?._id || ''}
                      onChange={(e) => updateUser(u._id, { assignedLdm: e.target.value || null })}
                    >
                      <option value="">Unassigned</option>
                      {ldms.map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{u.isActive ? 'Active' : 'Deactivated'}</td>
                <td>
                  {u.isActive && (
                    <button type="button" className="secondary" onClick={() => deactivateUser(u._id)}>
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
