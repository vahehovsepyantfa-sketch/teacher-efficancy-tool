import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import PdfExportButton from '../../components/UI/PdfExportButton';

const emptyScoreRow = () => ({ competency: '', score: 3, notes: '' });
const emptyForm = {
  teacher: '',
  subject: '',
  grade: '',
  lessonPlanLink: '',
  recordingLink: '',
  strengths: '',
  areasForGrowth: '',
  recommendations: '',
};

export default function ObservationForm() {
  const [teachers, setTeachers] = useState([]);
  const [observations, setObservations] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [form, setForm] = useState(emptyForm);
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
    loadData().catch(() => setError('Չհաջողվեց բեռնել տվյալները'));
  }, []);

  useEffect(() => {
    if (!form.teacher) {
      setReflections([]);
      return;
    }
    axiosClient
      .get(`/ldm/teachers/${form.teacher}/reflections`)
      .then(({ data }) => setReflections(data.reflections))
      .catch(() => setReflections([]));
  }, [form.teacher]);

  const updateScoreRow = (index, field, value) => {
    setScores((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addScoreRow = () => setScores((rows) => [...rows, emptyScoreRow()]);
  const removeScoreRow = (index) => setScores((rows) => rows.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.teacher) {
      setError('Ընտրեք ուսուցչին');
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
      setForm(emptyForm);
      setScores([emptyScoreRow()]);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց պահպանել դիտարկումը');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Նոր դասի դիտարկում</h2>
        {teachers.length === 0 && (
          <p className="muted">
            Ձեզ դեռևս ուսուցիչ չի վերագրված։ Խնդրեք ադմինիստրատորին վերագրել ուսուցիչներ ձեր հաշվին։
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label>
            <span>Ուսուցիչ</span>
            <select
              value={form.teacher}
              onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              required
            >
              <option value="">Ընտրեք ուսուցչին...</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          {form.teacher && (
            <div className="card" style={{ background: '#f3f7fc' }}>
              <h4 style={{ marginTop: 0 }}>Ուսուցչի վերջին ինքնավերլուծությունները</h4>
              {reflections.length === 0 && (
                <p className="muted">Այս ուսուցիչը դեռևս ինքնավերլուծություն չի լրացրել։</p>
              )}
              {reflections.slice(0, 3).map((r) => (
                <div key={r._id} style={{ marginBottom: '0.6rem' }}>
                  <p className="muted">
                    {new Date(r.date).toLocaleDateString('hy-AM')} · ինքնագնահատում {r.moodRating ?? '—'}/5
                  </p>
                  <p>{r.content}</p>
                </div>
              ))}
            </div>
          )}

          <label>
            <span>Առարկա</span>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </label>
          <label>
            <span>Դասարան</span>
            <input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
          </label>
          <label>
            <span>Դասի պլանի հղում</span>
            <input
              value={form.lessonPlanLink}
              onChange={(e) => setForm({ ...form, lessonPlanLink: e.target.value })}
            />
          </label>
          <label>
            <span>Տեսաձայնագրության հղում</span>
            <input
              value={form.recordingLink}
              onChange={(e) => setForm({ ...form, recordingLink: e.target.value })}
            />
          </label>
          <label>
            <span>Ուժեղ կողմեր</span>
            <textarea
              rows={3}
              value={form.strengths}
              onChange={(e) => setForm({ ...form, strengths: e.target.value })}
            />
          </label>
          <label>
            <span>Աջակցության կարիք ունեցող ուղղություններ</span>
            <textarea
              rows={3}
              value={form.areasForGrowth}
              onChange={(e) => setForm({ ...form, areasForGrowth: e.target.value })}
            />
          </label>

          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
            Դասի գնահատման կողմեր
          </span>
          {scores.map((row, i) => (
            <div className="competency-row" key={i}>
              <label>
                <span>Գնահատման կողմ</span>
                <input
                  value={row.competency}
                  onChange={(e) => updateScoreRow(i, 'competency', e.target.value)}
                  placeholder="օր.՝ Դասի պլանավորում"
                />
              </label>
              <label>
                <span>Գնահատական (0-5)</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={row.score}
                  onChange={(e) => updateScoreRow(i, 'score', e.target.value)}
                />
              </label>
              <label>
                <span>Մեկնաբանություն</span>
                <input value={row.notes} onChange={(e) => updateScoreRow(i, 'notes', e.target.value)} />
              </label>
              <button type="button" className="secondary" onClick={() => removeScoreRow(i)}>
                Հանել
              </button>
            </div>
          ))}
          <button type="button" className="secondary" onClick={addScoreRow} style={{ marginBottom: '0.9rem' }}>
            + Ավելացնել կողմ
          </button>

          <label>
            <span>Երաշանավորություններ</span>
            <textarea
              rows={3}
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
            />
          </label>

          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Պահպանվում է...' : 'Պահպանել դիտարկումը'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Նախորդ դիտարկումները</h3>
        {observations.length === 0 && <p className="muted">Դիտարկում դեռևս չկա։</p>}
        <table>
          <thead>
            <tr>
              <th>Ամսաթիվ</th>
              <th>Ուսուցիչ</th>
              <th>Առարկա / Դասարան</th>
              <th>Ընդհանուր</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {observations.map((o) => (
              <tr key={o._id}>
                <td>{new Date(o.date).toLocaleDateString('hy-AM')}</td>
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
