import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import VoiceToTextButton from '../../components/UI/VoiceToTextButton';
import PdfExportButton from '../../components/UI/PdfExportButton';
import { TeachingRubricEditor } from '../../components/UI/RubricEditor';
import { emptyTeachingRubric, emptyGoals } from '../../constants/teachingRubric';

const emptyHeader = {
  academicYear: '',
  subject: '',
  topic: '',
  grade: '',
  studentsCount: '',
  lessonPlanLink: '',
  recordingLink: '',
};

export default function ReflectionForm() {
  const [header, setHeader] = useState(emptyHeader);
  const [successfulDirections, setSuccessfulDirections] = useState('');
  const [previousGoalsProgress, setPreviousGoalsProgress] = useState('');
  const [selfRubric, setSelfRubric] = useState(emptyTeachingRubric());
  const [goals, setGoals] = useState(emptyGoals());
  const [inputMethod, setInputMethod] = useState('text');

  const [reflections, setReflections] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAll = async () => {
    const [reflRes, obsRes] = await Promise.all([
      axiosClient.get('/teacher/reflections'),
      axiosClient.get('/teacher/observations'),
    ]);
    setReflections(reflRes.data.reflections);
    setObservations(obsRes.data.observations);
  };

  useEffect(() => {
    loadAll().catch(() => setError('Չհաջողվեց բեռնել տվյալները'));
  }, []);

  const updateHeader = (field, value) => setHeader((h) => ({ ...h, [field]: value }));

  const updateGoalRow = (index, field, value) =>
    setGoals((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const resetForm = () => {
    setHeader(emptyHeader);
    setSuccessfulDirections('');
    setPreviousGoalsProgress('');
    setSelfRubric(emptyTeachingRubric());
    setGoals(emptyGoals());
    setInputMethod('text');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!header.lessonPlanLink.trim() || !header.recordingLink.trim()) {
      setError('Դասի պլանի հղումը և տեսաձայնագրության հղումը պարտադիր են');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/teacher/reflections', {
        ...header,
        studentsCount: header.studentsCount ? Number(header.studentsCount) : undefined,
        successfulDirections,
        previousGoalsProgress,
        selfRubric,
        goals,
        inputMethod,
      });
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց պահպանել ինքնանդրադարձը');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Ուսուցչի ինքնանդրադարձ (ՈՒԱ)</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>ՈՒԱ լրացման դաշտեր</h3>
            <div className="competency-row">
              <label>
                <span>Ուսումնական տարի</span>
                <input value={header.academicYear} onChange={(e) => updateHeader('academicYear', e.target.value)} />
              </label>
              <label>
                <span>Առարկա</span>
                <input value={header.subject} onChange={(e) => updateHeader('subject', e.target.value)} />
              </label>
              <label>
                <span>Թեմա</span>
                <input value={header.topic} onChange={(e) => updateHeader('topic', e.target.value)} />
              </label>
            </div>
            <div className="competency-row">
              <label>
                <span>Դասարան</span>
                <input value={header.grade} onChange={(e) => updateHeader('grade', e.target.value)} />
              </label>
              <label>
                <span>Աշակերտների քանակ</span>
                <input
                  type="number"
                  min={0}
                  value={header.studentsCount}
                  onChange={(e) => updateHeader('studentsCount', e.target.value)}
                />
              </label>
              <span />
            </div>
            <label>
              <span>Դասի պլանի հղում (Պարտադիր)</span>
              <input
                value={header.lessonPlanLink}
                onChange={(e) => updateHeader('lessonPlanLink', e.target.value)}
                required
              />
            </label>
            <label>
              <span>Տեսաձայնագրության հղում (Պարտադիր)</span>
              <input
                value={header.recordingLink}
                onChange={(e) => updateHeader('recordingLink', e.target.value)}
                required
              />
            </label>
          </div>

          <div className="form-section">
            <h3>Ինքնանդրադարձի հարցեր</h3>
            <label>
              <span>Ո՞ր ուղղություններով դասը հաջողված էր</span>
              <textarea
                rows={3}
                value={successfulDirections}
                onChange={(e) => {
                  setInputMethod('text');
                  setSuccessfulDirections(e.target.value);
                }}
              />
              <VoiceToTextButton
                onTranscript={(text) => {
                  setInputMethod('voice');
                  setSuccessfulDirections((v) => (v ? `${v} ${text}` : text));
                }}
              />
            </label>
            <label>
              <span>Որքանո՞վ առաջադիմեցիք նախորդ նպատակների շրջանակում</span>
              <textarea
                rows={3}
                value={previousGoalsProgress}
                onChange={(e) => {
                  setInputMethod('text');
                  setPreviousGoalsProgress(e.target.value);
                }}
              />
              <VoiceToTextButton
                onTranscript={(text) => {
                  setInputMethod('voice');
                  setPreviousGoalsProgress((v) => (v ? `${v} ${text}` : text));
                }}
              />
            </label>
          </div>

          <div className="form-section">
            <h3>Ինքնագնահատում՝ Դասավանդման Ընդհանուր Ակնկալիքների Բաղադրիչներով</h3>
            <p className="muted form-section-hint">
              Գնահատեք ձեր դասը ըստ ստորև ներկայացված բաղադրիչների (0-5 սանդղակ)։
            </p>
            <TeachingRubricEditor value={selfRubric} onChange={setSelfRubric} />
          </div>

          <div className="form-section">
            <h3>Նպատակի և նպատակին հասնելու գործողությունների սահմանում</h3>
            <p className="muted form-section-hint">
              Սահմանվում է ՈՒԱ-ի հետ համատեղ՝ լրացրեք ներքևում։
            </p>
            <table className="goals-table">
              <thead>
                <tr>
                  <th>Նպատակ</th>
                  <th>Հասնելու քայլեր</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <textarea value={row.goal} onChange={(e) => updateGoalRow(i, 'goal', e.target.value)} />
                    </td>
                    <td>
                      <textarea value={row.steps} onChange={(e) => updateGoalRow(i, 'steps', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Պահպանվում է...' : 'Պահպանել ինքնանդրադարձը'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Իմ դասի վերլուծություն</h3>
        <p className="muted form-section-hint">
          Այստեղ կհայտնվեն ԱԶՂ-ի կողմից ուղարկված դասի դիտարկման/վերլուծության ձևաթղթերը։
        </p>
        {observations.length === 0 && <p className="muted">Դեռևս ուղարկված դիտարկում չկա։</p>}
        {observations.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Ամսաթիվ</th>
                <th>ԱԶՂ</th>
                <th>Առարկա / Դասարան</th>
                <th>Ընդհանուր միջին</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {observations.map((o) => (
                <tr key={o._id}>
                  <td>{new Date(o.date).toLocaleDateString('hy-AM')}</td>
                  <td>{o.ldm?.name || '—'}</td>
                  <td>
                    {o.subject || '—'} / {o.grade || '—'}
                  </td>
                  <td>
                    <span className="score-pill">{o.grandAverage ?? '—'}/5</span>
                  </td>
                  <td>
                    <PdfExportButton
                      endpoint={`/teacher/observations/${o._id}/pdf`}
                      filename={`observation-${o._id}.pdf`}
                      label="PDF"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Նախորդ ինքնանդրադարձները</h3>
        {reflections.length === 0 && <p className="muted">Դեռևս ինքնանդրադարձ չկա։</p>}
        {reflections.map((r) => (
          <div key={r._id} className="card" style={{ background: '#fafbfc' }}>
            <p className="muted">
              {new Date(r.date).toLocaleDateString('hy-AM')}
              {r.subject ? ` · ${r.subject}` : ''}
              {r.topic ? ` · ${r.topic}` : ''}
              {r.grade ? ` · ${r.grade}` : ''}
              {' · '}
              {r.inputMethod === 'voice' ? 'ձայնային' : 'տեքստային'}
            </p>
            <p>
              <strong>Ինքնագնահատման ամփոփիչ միավոր՝</strong> {r.selfRubric?.overallAverage ?? '—'}/5
            </p>
            {r.successfulDirections && (
              <p>
                <strong>Հաջողված ուղղություններ՝</strong> {r.successfulDirections}
              </p>
            )}
            {r.previousGoalsProgress && (
              <p>
                <strong>Նախորդ նպատակների ընթացք՝</strong> {r.previousGoalsProgress}
              </p>
            )}
            {r.lessonPlanLink && (
              <p>
                <a href={r.lessonPlanLink} target="_blank" rel="noreferrer">
                  Դասի պլան
                </a>
              </p>
            )}
            {r.recordingLink && (
              <p>
                <a href={r.recordingLink} target="_blank" rel="noreferrer">
                  Տեսաձայնագրություն
                </a>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
