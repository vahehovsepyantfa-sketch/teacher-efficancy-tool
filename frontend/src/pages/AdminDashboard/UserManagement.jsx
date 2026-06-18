import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const ROLES = ['teacher', 'ldm', 'admin'];
const ROLE_LABELS = { teacher: 'Ուսուցիչ', ldm: 'ԱԶՂ մասնագետ', admin: 'Ադմինիստրատոր' };
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
    loadUsers().catch(() => setError('Չհաջողվեց բեռնել օգտատերերի ցանկը'));
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
      setError(err.response?.data?.message || 'Չհաջողվեց ստեղծել օգտատեր');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, patch) => {
    try {
      await axiosClient.patch(`/admin/users/${id}`, patch);
      await loadUsers();
    } catch {
      setError('Չհաջողվեց թարմացնել օգտատերին');
    }
  };

  const deactivateUser = async (id) => {
    try {
      await axiosClient.delete(`/admin/users/${id}`);
      await loadUsers();
    } catch {
      setError('Չհաջողվեց ապաակտիվացնել օգտատերին');
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Նոր օգտատերի ստեղծում</h2>
        <form onSubmit={handleCreate}>
          <label>
            <span>Անուն</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            <span>Էլ. փոստ</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Ժամանակավոր գաղտնաբառ</span>
            <input
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>
          <label>
            <span>Դեր</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Ստեղծվում է...' : 'Ստեղծել օգտատեր'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Բոլոր օգտատերերը</h3>
        <table>
          <thead>
            <tr>
              <th>Անուն</th>
              <th>Էլ. փոստ</th>
              <th>Դեր</th>
              <th>Կցված ԱԶՂ մասնագետ</th>
              <th>Կարգավիճակ</th>
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
                        {ROLE_LABELS[r]}
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
                      <option value="">Չկցված</option>
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
                <td>{u.isActive ? 'Ակտիվ' : 'Ապաակտիվացված'}</td>
                <td>
                  {u.isActive && (
                    <button type="button" className="secondary" onClick={() => deactivateUser(u._id)}>
                      Ապաակտիվացնել
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
