import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import PdfExportButton from '../../components/UI/PdfExportButton';

const emptyScoreRow = () => ({ competency: '', score: 3, notes: '' });

export default function ObservationForm() {
  const [teachers, setTeachers] = useState([]);
  const [observations, setObservations] = useState([]);
  const [form, setForm] = useState({
    teacher: '',
    subject: '',
    grade: '',
    strengths: '',
    areasForGrowth: '',
    recommendations: '',
  });
  const [scores, setScores] = useState([emptyScoreRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const [teachersRes, obsRes] = await Promise.all([
      axiosClient.get('/ldm/teachers'),
      axiosClient.get('/ldm/observations'),
    ]);
    setTeachers(teachersRes.data.teachers);
    setObservations(obsRes.data.observations);
  };

  useEffect(() => {
    loadData().catch(() => setError('Failed to load data'));
  }, []);

  const updateScoreRow = (index, field, value) => {
    setScores((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addScoreRow = () => setScores((rows) => [...rows, emptyScoreRow()]);
  const removeScoreRow = (index) => setScores((rows) => rows.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teacher) {
      setError('Select a teacher first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/ldm/observations', {
        ...form,
        competencyScores: scores
          .filter((s) => s.competency.trim())
          .map((s) => ({ ...s, score: Number(s.score) })),
      });
      setForm({ teacher: '', subject: '', grade: '', strengths: '', areasForGrowth: '', recommendations: '' });
      setScores([emptyScoreRow()]);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save observation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>New Lesson Observation</h2>
        {teachers.length === 0 && (
          <p className="muted">
            No teachers are assigned to you yet. Ask an admin to assign teachers to your account.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label>
            <span>Teacher</span>
            <select
              value={form.teacher}
              onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              required
            >
              <option value="">Select a teacher…</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Subject</span>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </label>
          <label>
            <span>Grade</span>
            <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </label>
          <label>
            <span>Strengths</span>
            <textarea
              rows={3}
              value={form.strengths}
              onChange={(e) => setForm({ ...form, strengths: e.target.value })}
            />
          </label>
          <label>
            <span>Areas for growth</span>
            <textarea
              rows={3}
              value={form.areasForGrowth}
              onChange={(e) => setForm({ ...form, areasForGrowth: e.target.value })}
            />
          </label>

          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
            Competency scores
          </span>
          {scores.map((row, i) => (
            <div className="competency-row" key={i}>
              <label>
                <span>Competency</span>
                <input
                  value={row.competency}
                  onChange={(e) => updateScoreRow(i, 'competency', e.target.value)}
                  placeholder="e.g. Lesson planning"
                />
              </label>
              <label>
                <span>Score (1-5)</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={row.score}
                  onChange={(e) => updateScoreRow(i, 'score', e.target.value)}
                />
              </label>
              <label>
                <span>Notes</span>
                <input value={row.notes} onChange={(e) => updateScoreRow(i, 'notes', e.target.value)} />
              </label>
              <button type="button" className="secondary" onClick={() => removeScoreRow(i)}>
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="secondary" onClick={addScoreRow} style={{ marginBottom: '0.9rem' }}>
            + Add competency
          </button>

          <label>
            <span>Recommendations</span>
            <textarea
              rows={3}
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
            />
          </label>

          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save observation'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Past observations</h3>
        {observations.length === 0 && <p className="muted">No observations recorded yet.</p>}
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Teacher</th>
              <th>Subject / Grade</th>
              <th>Overall</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {observations.map((o) => (
              <tr key={o._id}>
                <td>{new Date(o.date).toLocaleDateString()}</td>
                <td>{o.teacher?.name}</td>
                <td>
                  {o.subject || '—'} / {o.grade || '—'}
                </td>
                <td>
                  <span className="score-pill">{o.overallScore ?? '—'}/5</span>
                </td>
                <td>
                  <PdfExportButton
                    endpoint={`/ldm/observations/${o._id}/pdf`}
                    filename={`observation-${o._id}.pdf`}
                    label="PDF"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
