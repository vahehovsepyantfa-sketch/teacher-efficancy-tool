import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

const ROLES = ['teacher', 'ldm', 'admin'];
const ROLE_LABELS = { teacher: 'Ուսուցիչ', ldm: 'ԱԶՂ մասնագետ', admin: 'Ադմինիստրատոր' };
const emptyForm = { name: '', email: '', password: '', role: 'teacher', school: '', region: '', assignedLdm: '' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pwInputs, setPwInputs] = useState({});
  const [pwStatus, setPwStatus] = useState({});

  const loadUsers = async () => {
    const { data } = await axiosClient.get('/admin/users');
    setUsers(data.users);
  };

  useEffect(() => {
    loadUsers().catch(() => setError('Չհաջողվեց բեռնել օգտատերերի ցանկը'));
  }, []);

  const ldms = users.filter((u) => u.role === 'ldm');
  const teachers = users.filter((u) => u.role === 'teacher');
  const admins = users.filter((u) => u.role === 'admin');

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/admin/users', {
        ...form,
        assignedLdm: form.role === 'teacher' && form.assignedLdm ? form.assignedLdm : undefined,
      });
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

  const deleteUser = async (u) => {
    const confirmed = window.confirm(
      `Ջնջել «${u.name}» (${u.email}) օգտատերին ընդմիշտ։ Այս գործողությունը հնարավոր չէ հետարկել։ Շարունակել՞:`
    );
    if (!confirmed) return;
    setError('');
    try {
      await axiosClient.delete(`/admin/users/${u._id}/permanent`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց ջնջել օգտատերին');
    }
  };

  const resetPassword = async (id) => {
    const value = pwInputs[id] || '';
    if (value.length < 6) {
      setPwStatus((s) => ({ ...s, [id]: 'Գաղտնաբառը պետք է լինի առնվազն 6 նշան' }));
      return;
    }
    try {
      await axiosClient.patch(`/admin/users/${id}`, { password: value });
      setPwInputs((s) => ({ ...s, [id]: '' }));
      setPwStatus((s) => ({ ...s, [id]: 'Գաղտնաբառը փոխվեց' }));
    } catch {
      setPwStatus((s) => ({ ...s, [id]: 'Չհաջողվեց փոխել գաղտնաբառը' }));
    }
  };

  const renderRow = (u) => (
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
        <div className="row-password-reset">
          <input
            type="password"
            placeholder="Նոր գաղտնաբառ"
            minLength={6}
            value={pwInputs[u._id] || ''}
            onChange={(e) => setPwInputs((s) => ({ ...s, [u._id]: e.target.value }))}
          />
          <button type="button" className="secondary" onClick={() => resetPassword(u._id)}>
            Փոխել
          </button>
          {pwStatus[u._id] && <p className="muted form-section-hint">{pwStatus[u._id]}</p>}
        </div>
      </td>
      <td>
        <div className="row-actions">
          {u.isActive && (
            <button type="button" className="secondary" onClick={() => deactivateUser(u._id)}>
              Ապաակտիվացնել
            </button>
          )}
          <button type="button" className="danger" onClick={() => deleteUser(u)}>
            Ջնջել
          </button>
        </div>
      </td>
    </tr>
  );

  const renderTable = (title, list, emptyText) => (
    <div className="card">
      <h3>{title}</h3>
      {list.length === 0 ? (
        <p className="muted">{emptyText}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Անուն</th>
              <th>Էլ. փոստ</th>
              <th>Դեր</th>
              <th>Կցված ԱԶՂ մասնագետ</th>
              <th>Կարգավիճակ</th>
              <th>Գաղտնաբառի վերակայում</th>
              <th></th>
            </tr>
          </thead>
          <tbody>{list.map(renderRow)}</tbody>
        </table>
      )}
    </div>
  );

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
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, assignedLdm: '' })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          {form.role === 'teacher' && (
            <label>
              <span>Կցվող ԱԶՂ մասնագետ (եթե հասանելի է)</span>
              <select value={form.assignedLdm} onChange={(e) => setForm({ ...form, assignedLdm: e.target.value })}>
                <option value="">Չկցված (կարող եք կցել ավելի ուշ)</option>
                {ldms.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
              {ldms.length === 0 && (
                <p className="muted form-section-hint">
                  Դեռևս չկա ստեղծված ԱԶՂ մասնագետ։ Ուսուցիչը կարող եք կցել ավելի ուշ՝ ստորև բերված ցանկից։
                </p>
              )}
            </label>
          )}
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Ստեղծվում է...' : 'Ստեղծել օգտատեր'}
          </button>
        </form>
      </div>

      {renderTable('Գրանցված ուսուցիչներ', teachers, 'Դեռևս չկա գրանցված ուսուցիչ։')}
      {renderTable('Գրանցված ԱԶՂ մասնագետներ', ldms, 'Դեռևս չկա գրանցված ԱԶՂ մասնագետ։')}
      {renderTable('Ադմինիստրատորներ', admins, 'Դեռևս չկա ադմինիստրատոր։')}
    </div>
  );
}
