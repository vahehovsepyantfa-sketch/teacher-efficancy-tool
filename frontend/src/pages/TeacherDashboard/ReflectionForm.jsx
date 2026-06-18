import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import VoiceToTextButton from '../../components/UI/VoiceToTextButton';
import { SCORE_SCALE } from '../../constants/competencyFramework';

const emptyForm = {
  content: '',
  moodRating: 3,
  subject: '',
  grade: '',
  studentsCount: '',
  lessonPlanLink: '',
  recordingLink: '',
  successfulDirections: '',
  previousGoalsProgress: '',
};

export default function ReflectionForm() {
  const [form, setForm] = useState(emptyForm);
  const [inputMethod, setInputMethod] = useState('text');
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedbackLoadingId, setFeedbackLoadingId] = useState(null);
  const [error, setError] = useState('');

  const loadReflections = async () => {
    const { data } = await axiosClient.get('/teacher/reflections');
    setReflections(data.reflections);
  };

  useEffect(() => {
    loadReflections().catch(() => setError('Չհաջողվեց բեռնել ինքնավերլուծությունները'));
  }, []);

  const updateField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleVoiceTranscript = (text) => {
    setInputMethod('voice');
    updateField('content', form.content ? `${form.content} ${text}` : text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/teacher/reflections', {
        ...form,
        moodRating: Number(form.moodRating),
        studentsCount: form.studentsCount ? Number(form.studentsCount) : undefined,
        inputMethod,
      });
      setForm(emptyForm);
      setInputMethod('text');
      await loadReflections();
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց պահպանել ինքնավերլուծությունը');
    } finally {
      setLoading(false);
    }
  };

  const requestFeedback = async (id) => {
    setFeedbackLoadingId(id);
    try {
      await axiosClient.post(`/ai/reflections/${id}/feedback`);
      await loadReflections();
    } catch {
      setError('Չհաջողվեց ստանալ AI հետադարձ կապ');
    } finally {
      setFeedbackLoadingId(null);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Օրական ինքնավերլուծություն</h2>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Ինչպես անցավ դասը: Ի՞նչ ստացվեց, ի՞նչ էր դժվար, ի՞նչ կփորձես վաղը</span>
            <textarea
              rows={5}
              value={form.content}
              onChange={(e) => {
                setInputMethod('text');
                updateField('content', e.target.value);
              }}
              required
            />
          </label>

          <div className="competency-row">
            <label>
              <span>Առարկա</span>
              <input value={form.subject} onChange={(e) => updateField('subject', e.target.value)} />
            </label>
            <label>
              <span>Դասարան</span>
              <input value={form.grade} onChange={(e) => updateField('grade', e.target.value)} />
            </label>
            <label>
              <span>Աշակերտների քանակ</span>
              <input
                type="number"
                min={0}
                value={form.studentsCount}
                onChange={(e) => updateField('studentsCount', e.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Դասի պլանի հղում (ոչ պարտադիր)</span>
            <input value={form.lessonPlanLink} onChange={(e) => updateField('lessonPlanLink', e.target.value)} />
          </label>
          <label>
            <span>Տեսաձայնագրության հղում (ոչ պարտադիր)</span>
            <input value={form.recordingLink} onChange={(e) => updateField('recordingLink', e.target.value)} />
          </label>
          <label>
            <span>Հաջողված ուղղություններ</span>
            <textarea
              rows={3}
              value={form.successfulDirections}
              onChange={(e) => updateField('successfulDirections', e.target.value)}
            />
          </label>
          <label>
            <span>Նախորդ նպատակների հասանելիություն</span>
            <textarea
              rows={3}
              value={form.previousGoalsProgress}
              onChange={(e) => updateField('previousGoalsProgress', e.target.value)}
            />
          </label>

          <label>
            <span>
              Ինքնագնահատում՝ {form.moodRating}/5 —{' '}
              {SCORE_SCALE.find((s) => s.value === Number(form.moodRating))?.label}
            </span>
            <input
              type="range"
              min={0}
              max={5}
              value={form.moodRating}
              onChange={(e) => updateField('moodRating', e.target.value)}
            />
          </label>

          <div style={{ marginBottom: '0.9rem' }}>
            <VoiceToTextButton onTranscript={handleVoiceTranscript} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Պահպանվում է...' : 'Պահպանել ինքնավերլուծությունը'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Նախորդ ինքնավերլուծությունները</h3>
        {reflections.length === 0 && <p className="muted">Դեռևս ինքնավերլուծություն չկա։</p>}
        {reflections.map((r) => (
          <div key={r._id} className="card" style={{ background: '#fafbfc' }}>
            <p className="muted">
              {new Date(r.date).toLocaleDateString('hy-AM')} · ինքնագնահատում {r.moodRating ?? '—'}/5 ·{' '}
              {r.inputMethod === 'voice' ? 'ձայնային' : 'տեքստային'}
              {r.subject ? ` · ${r.subject}` : ''}
              {r.grade ? ` / ${r.grade}` : ''}
            </p>
            <p>{r.content}</p>
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
            {r.aiFeedback ? (
              <p>
                <strong>AI մարզչական հետադարձ կապ՝</strong> {r.aiFeedback}
              </p>
            ) : (
              <button
                type="button"
                className="secondary"
                onClick={() => requestFeedback(r._id)}
                disabled={feedbackLoadingId === r._id}
              >
                {feedbackLoadingId === r._id ? 'Ստեղծվում է...' : 'Ստանալ AI հետադարձ կապ'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
