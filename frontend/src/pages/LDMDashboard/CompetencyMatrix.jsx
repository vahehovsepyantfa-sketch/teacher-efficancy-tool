import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import PdfExportButton from '../../components/UI/PdfExportButton';

const emptyScoreRow = () => ({ name: '', score: 3, notes: '' });

export default function CompetencyMatrix() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [matrix, setMatrix] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [period, setPeriod] = useState('');
  const [scores, setScores] = useState([emptyScoreRow()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient
      .get('/ldm/teachers')
      .then(({ data }) => setTeachers(data.teachers))
      .catch(() => setError('Failed to load teachers'));
  }, []);

  const loadTeacherData = async (id) => {
    if (!id) {
      setMatrix([]);
      setEvaluations([]);
      return;
    }
    const [matrixRes, evalRes] = await Promise.all([
      axiosClient.get('/ldm/evaluations/matrix', { params: { teacher: id } }),
      axiosClient.get('/ldm/evaluations', { params: { teacher: id } }),
    ]);
    setMatrix(matrixRes.data.matrix);
    setEvaluations(evalRes.data.evaluations);
  };

  useEffect(() => {
    loadTeacherData(teacherId).catch(() => setError('Failed to load competency data'));
  }, [teacherId]);

  const updateScoreRow = (index, field, value) => {
    setScores((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addScoreRow = () => setScores((rows) => [...rows, emptyScoreRow()]);
  const removeScoreRow = (index) => setScores((rows) => rows.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId || !period.trim()) {
      setError('Select a teacher and enter a period (e.g. "2026 Term 1")');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/ldm/evaluations', {
        teacher: teacherId,
        period,
        competencies: scores
          .filter((s) => s.name.trim())
          .map((s) => ({ ...s, score: Number(s.score) })),
      });
      setPeriod('');
      setScores([emptyScoreRow()]);
      await loadTeacherData(teacherId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save evaluation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Competency Matrix</h2>
        <label>
          <span>Teacher</span>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Select a teacher…</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        {teacherId && matrix.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Competency</th>
                <th>Average</th>
                <th>Trend</th>
                <th>Evaluations</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>
                    <span className="score-pill">{row.average}/5</span>
                  </td>
                  <td>
                    {row.trend.direction === 'up' && `▲ +${row.trend.change}`}
                    {row.trend.direction === 'down' && `▼ ${row.trend.change}`}
                    {row.trend.direction === 'flat' && '—'}
                  </td>
                  <td>{row.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {teacherId && matrix.length === 0 && (
          <p className="muted">No competency evaluations recorded for this teacher yet.</p>
        )}
      </div>

      {teacherId && (
        <div className="card">
          <h3>Add new evaluation</h3>
          <form onSubmit={handleSubmit}>
            <label>
              <span>Period</span>
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder='e.g. "2026 Term 1"'
              />
            </label>

            {scores.map((row, i) => (
              <div className="competency-row" key={i}>
                <label>
                  <span>Competency</span>
                  <input value={row.name} onChange={(e) => updateScoreRow(i, 'name', e.target.value)} />
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

            {error && <p className="error-text">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save evaluation'}
            </button>
          </form>
        </div>
      )}

      {teacherId && evaluations.length > 0 && (
        <div className="card">
          <h3>Evaluation history</h3>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Average</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => (
                <tr key={ev._id}>
                  <td>{ev.period}</td>
                  <td>
                    <span className="score-pill">{ev.averageScore}/5</span>
                  </td>
                  <td>
                    <PdfExportButton
                      endpoint={`/ldm/evaluations/${ev._id}/pdf`}
                      filename={`evaluation-${ev._id}.pdf`}
                      label="PDF"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
