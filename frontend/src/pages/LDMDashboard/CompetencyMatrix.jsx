import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import PdfExportButton from '../../components/UI/PdfExportButton';
import { COMPETENCY_CATEGORIES, SCORE_SCALE } from '../../constants/competencyFramework';

const emptyDraft = () =>
  COMPETENCY_CATEGORIES.map((cat) => ({
    key: cat.key,
    name: cat.name,
    rows: cat.competencies.map((name) => ({ name, score: '', notes: '', aiRationale: '' })),
  }));

// Pre-fills the editable draft from the live matrix (latest saved scores +
// any notes already pushed in from the manifestation chat), so nothing the
// LDM or the chat already entered is lost or hidden from the editor.
const draftFromMatrix = (matrix) =>
  matrix.categories.map((cat) => ({
    key: cat.key,
    name: cat.name,
    rows: cat.rows.map((row) => ({
      name: row.name,
      score: row.score === null || row.score === undefined ? '' : String(row.score),
      notes: row.notes || '',
      aiRationale: '',
    })),
  }));

export default function CompetencyMatrix() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [matrixPeriod, setMatrixPeriod] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [period, setPeriod] = useState('');
  const [draft, setDraft] = useState(emptyDraft());
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    axiosClient
      .get('/ldm/teachers')
      .then(({ data }) => setTeachers(data.teachers))
      .catch(() => setError('Չհաջողվեց բեռնել ուսուցիչների ցանկը'));
  }, []);

  const loadTeacherData = async (id) => {
    if (!id) {
      setMatrix(null);
      setMatrixPeriod(null);
      setEvaluations([]);
      setDraft(emptyDraft());
      return;
    }
    const [matrixRes, evalRes] = await Promise.all([
      axiosClient.get('/ldm/evaluations/matrix', { params: { teacher: id } }),
      axiosClient.get('/ldm/evaluations', { params: { teacher: id } }),
    ]);
    setMatrix(matrixRes.data.matrix);
    setMatrixPeriod(matrixRes.data.period);
    setEvaluations(evalRes.data.evaluations);
    setDraft(matrixRes.data.matrix ? draftFromMatrix(matrixRes.data.matrix) : emptyDraft());
  };

  useEffect(() => {
    loadTeacherData(teacherId).catch(() => setError('Չհաջողվեց բեռնել կարողունակությունների տվյալները'));
  }, [teacherId]);

  const updateDraftRow = (catIndex, rowIndex, field, value) => {
    setDraft((cats) =>
      cats.map((cat, ci) =>
        ci !== catIndex
          ? cat
          : {
              ...cat,
              rows: cat.rows.map((row, ri) =>
                ri !== rowIndex ? row : { ...row, [field]: value, ...(field === 'score' ? { aiRationale: '' } : {}) }
              ),
            }
      )
    );
  };

  const handleRefresh = async () => {
    setError('');
    setNotice('');
    try {
      await loadTeacherData(teacherId);
      setNotice('Մատրիցան թարմացվեց՝ ներառյալ չատից եկած նոր մեկնաբանությունները');
    } catch (err) {
      setError('Չհաջողվեց թարմացնել տվյալները');
    }
  };

  const handleSuggestScores = async () => {
    if (!teacherId) return;
    setSuggestLoading(true);
    setError('');
    setNotice('');
    try {
      const competencies = draft.flatMap((cat) => cat.rows).map((row) => ({ name: row.name, notes: row.notes }));
      const { data } = await axiosClient.post('/ai/competencies/suggest-scores', {
        teacher: teacherId,
        competencies,
      });
      const suggestions = data.suggestions || [];
      if (suggestions.length === 0) {
        setNotice('Գնահատելու համար անհրաժեշտ է գոնե մեկ տողում մեկնաբանություն');
      } else {
        setDraft((cats) =>
          cats.map((cat) => ({
            ...cat,
            rows: cat.rows.map((row) => {
              const s = suggestions.find((x) => x.name === row.name);
              if (!s || s.score === null || s.score === undefined) return row;
              return { ...row, score: String(s.score), aiRationale: s.rationale || '' };
            }),
          }))
        );
        setNotice('AI-ի առաջարկած գնահատականները լրացվեցին․ կարող եք ուղղել ցանկացած տող ուղարկելուց առաջ');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց ստանալ AI գնահատականները');
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacherId || !period.trim()) {
      setError('Ընտրեք ուսուցչին և մուտքագրեք ժամանակահատվածը (օր.՝ «2026, 1-ին կիսամյակ»)');
      return;
    }
    const competencies = draft
      .flatMap((cat) => cat.rows)
      .filter((row) => row.score !== '')
      .map((row) => ({ name: row.name, score: Number(row.score), notes: row.notes }));

    if (competencies.length === 0) {
      setError('Մուտքագրեք գոնե մեկ կարողունակության գնահատական');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    try {
      await axiosClient.post('/ldm/evaluations', { teacher: teacherId, period, competencies });
      setPeriod('');
      await loadTeacherData(teacherId);
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց պահպանել գնահատումը');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Առաջնորդական կարողունակությունների մատրիցա</h2>
        <p className="muted">
          18 հաստատագրված կարողունակություն, խմբավորված 5 կատեգորիայով, 0-5 սանդղակով։ Տես նաև{' '}
          <Link to="/ldm/chat">դրսևորումների AI չատը</Link>, որտեղ մուտքագրած պահվածքները ինքնաբերաբար
          կդասակարգվեն և կհայտնվեն ստորև համապատասխան կարողունակության մեկնաբանության դաշտում։
        </p>
        <label>
          <span>Ուսուցիչ</span>
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">Ընտրեք ուսուցչին...</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {teacherId && (
          <button type="button" onClick={handleRefresh} disabled={loading}>
            Թարմացնել (բեռնել չատի նոր մեկնաբանությունները)
          </button>
        )}

        {teacherId && matrix && (
          <>
            <p className="muted">
              Վերջին գնահատման ժամանակահատվածը՝ {matrixPeriod || '—'} ({matrix.completed}/{matrix.total}{' '}
              կարողունակություն գնահատված)
            </p>
            {matrix.categories.map((cat) => (
              <div key={cat.key} style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.3rem' }}>
                  {cat.name} — <span className="score-pill">{cat.categoryAverage ?? '—'}/5</span>
                </h4>
                <table>
                  <thead>
                    <tr>
                      <th>Կարողունակություն</th>
                      <th>Գնահատական</th>
                      <th>Մեկնաբանություն</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.rows.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.score ?? '—'}/5</td>
                        <td style={{ whiteSpace: 'pre-wrap' }}>{row.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p style={{ fontWeight: 700 }}>Ընդհանուր միջին գնահատական՝ {matrix.overallAverage ?? '—'}/5</p>
          </>
        )}
      </div>

      {teacherId && (
        <div className="card">
          <h3>Նոր գնահատում</h3>
          <p className="muted">
            Սանդղակ՝ {SCORE_SCALE.map((s) => `${s.value}=${s.label}`).join(', ')}
          </p>
          <p className="muted form-section-hint">
            Գնահատականները կարող են AI-ի կողմից առաջարկվել ըստ մեկնաբանությունների, սակայն մնում են ձեռքով
            խմբագրելի՝ պահպանելուց առաջ։
          </p>
          <form onSubmit={handleSubmit}>
            <label>
              <span>Ժամանակահատված</span>
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder='օր.՝ "2026, 1-ին կիսամյակ"'
              />
            </label>

            {draft.map((cat, ci) => (
              <div key={cat.key} style={{ marginBottom: '1rem' }}>
                <h4 style={{ marginBottom: '0.3rem' }}>{cat.name}</h4>
                {cat.rows.map((row, ri) => (
                  <div className="competency-row" key={row.name}>
                    <label>
                      <span>{row.name}</span>
                    </label>
                    <label>
                      <span>Գնահատական</span>
                      <select
                        value={row.score}
                        onChange={(e) => updateDraftRow(ci, ri, 'score', e.target.value)}
                      >
                        <option value="">—</option>
                        {SCORE_SCALE.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.value} — {s.label}
                          </option>
                        ))}
                      </select>
                      {row.aiRationale && <p className="muted ai-rationale">AI հիմնավորում՝ {row.aiRationale}</p>}
                    </label>
                    <label>
                      <span>Մեկնաբանություն</span>
                      <textarea
                        rows={2}
                        value={row.notes}
                        onChange={(e) => updateDraftRow(ci, ri, 'notes', e.target.value)}
                      />
                    </label>
                  </div>
                ))}
              </div>
            ))}

            {error && <p className="error-text">{error}</p>}
            {notice && <p className="muted">{notice}</p>}
            <div className="competency-row" style={{ alignItems: 'flex-start' }}>
              <button type="submit" disabled={loading}>
                {loading ? 'Պահպանվում է...' : 'Պահպանել գնահատումը'}
              </button>
              <button type="button" onClick={handleSuggestScores} disabled={suggestLoading || loading}>
                {suggestLoading ? 'Գնահատվում է...' : 'Գնահատել ըստ մեկնաբանությունների'}
              </button>
            </div>
          </form>
        </div>
      )}

      {teacherId && evaluations.length > 0 && (
        <div className="card">
          <h3>Գնահատումների պատմություն</h3>
          <table>
            <thead>
              <tr>
                <th>Ժամանակահատված</th>
                <th>Միջին</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => (
                <tr key={ev._id}>
                  <td>{ev.period}</td>
                  <td>
                    <span className="score-pill">{ev.averageScore ?? '—'}/5</span>
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
