import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import PdfExportButton from '../../components/UI/PdfExportButton';
import VoiceToTextButton from '../../components/UI/VoiceToTextButton';
import { TeachingRubricEditor, FlatRubricEditor } from '../../components/UI/RubricEditor';
import {
  PLANNING_RUBRIC_CRITERIA,
  OVERALL_EXPECTATIONS_CRITERIA,
  TIMELINE_PHASES,
  emptyTeachingRubric,
  emptyFlatRubric,
  emptyTimeline,
  emptyGoals,
} from '../../constants/teachingRubric';

const emptyHeader = { teacher: '', subject: '', grade: '', lessonPlanLink: '', recordingLink: '' };
const emptyCoaching = {
  feltAtStart: '',
  selfReflectionSummary: '',
  strengthsObserved: '',
  improvementsObserved: '',
  questionsForTeacher: '',
  practicalWorkPlan: '',
  feltAtEnd: '',
  goals: emptyGoals(),
  resourcesAndGuidance: '',
};

export default function ObservationForm() {
  const [teachers, setTeachers] = useState([]);
  const [observations, setObservations] = useState([]);
  const [reflections, setReflections] = useState([]);

  const [observationId, setObservationId] = useState(null);
  const [header, setHeader] = useState(emptyHeader);
  const [planningRubric, setPlanningRubric] = useState(emptyFlatRubric(PLANNING_RUBRIC_CRITERIA));
  const [timeline, setTimeline] = useState(emptyTimeline());
  const [teachingRubric, setTeachingRubric] = useState(emptyTeachingRubric());
  const [coaching, setCoaching] = useState(emptyCoaching);
  const [overallExpectations, setOverallExpectations] = useState(emptyFlatRubric(OVERALL_EXPECTATIONS_CRITERIA));
  const [sent, setSent] = useState(false);

  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
    if (!header.teacher) {
      setReflections([]);
      return;
    }
    axiosClient
      .get(`/ldm/teachers/${header.teacher}/reflections`)
      .then(({ data }) => setReflections(data.reflections));
  }, [header.teacher]);

  const resetForm = () => {
    setObservationId(null);
    setHeader(emptyHeader);
    setPlanningRubric(emptyFlatRubric(PLANNING_RUBRIC_CRITERIA));
    setTimeline(emptyTimeline());
    setTeachingRubric(emptyTeachingRubric());
    setCoaching(emptyCoaching);
    setOverallExpectations(emptyFlatRubric(OVERALL_EXPECTATIONS_CRITERIA));
    setSent(false);
    setNotice('');
  };

  const loadObservationIntoForm = (o) => {
    setObservationId(o._id);
    setHeader({
      teacher: o.teacher?._id || o.teacher,
      subject: o.subject || '',
      grade: o.grade || '',
      lessonPlanLink: o.lessonPlanLink || '',
      recordingLink: o.recordingLink || '',
    });
    setPlanningRubric(o.planningRubric || emptyFlatRubric(PLANNING_RUBRIC_CRITERIA));
    setTimeline(o.timeline && o.timeline.length ? o.timeline : emptyTimeline());
    setTeachingRubric(o.teachingRubric || emptyTeachingRubric());
    setCoaching({ ...emptyCoaching, ...(o.coaching || {}), goals: o.coaching?.goals?.length ? o.coaching.goals : emptyGoals() });
    setOverallExpectations(o.overallExpectations || emptyFlatRubric(OVERALL_EXPECTATIONS_CRITERIA));
    setSent(!!o.sent);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editObservation = async (id) => {
    try {
      const { data } = await axiosClient.get(`/ldm/observations/${id}`);
      loadObservationIntoForm(data.observation);
    } catch {
      setError('Չհաջողվեց բեռնել դիտարկումը');
    }
  };

  const updateTimelineCell = (index, field, value) =>
    setTimeline((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const updateCoachingField = (field, value) => setCoaching((c) => ({ ...c, [field]: value }));
  const updateCoachingGoalRow = (index, field, value) =>
    setCoaching((c) => ({
      ...c,
      goals: c.goals.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));

  const buildPayload = () => ({
    id: observationId || undefined,
    teacher: header.teacher,
    subject: header.subject,
    grade: header.grade,
    lessonPlanLink: header.lessonPlanLink,
    recordingLink: header.recordingLink,
    planningRubric,
    timeline,
    teachingRubric,
    coaching,
    overallExpectations,
  });

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!header.teacher) {
      setError('Ընտրեք ուսուցչին');
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { data } = await axiosClient.post('/ldm/observations', buildPayload());
      loadObservationIntoForm(data.observation);
      setNotice('Պահպանվեց որպես սևագիր։');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց պահպանել դիտարկումը');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!observationId) {
      setError('Նախ պահպանեք դիտարկումը, հետո ուղարկեք');
      return;
    }
    setSending(true);
    setError('');
    try {
      const { data } = await axiosClient.post(`/ldm/observations/${observationId}/send`);
      setSent(!!data.observation.sent);
      setNotice('Ուղարկվեց ուսուցչին։');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց ուղարկել դիտարկումը');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>{observationId ? 'Դասի դիտարկման և վերլուծության ձևաթուղթ (խմբագրում)' : 'Նոր դասի դիտարկման և վերլուծության ձևաթուղթ'}</h2>
        {teachers.length === 0 && (
          <p className="muted">
            Ձեզ դեռևս ուսուցիչ չի վերագրված։ Խնդրեք ադմինիստրատորին վերագրել ուսուցիչներ ձեր հաշվին։
          </p>
        )}
        <form onSubmit={handleSaveDraft}>
          <label>
            <span>Ուսուցիչ</span>
            <select
              value={header.teacher}
              onChange={(e) => setHeader({ ...header, teacher: e.target.value })}
              disabled={!!observationId}
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

          {header.teacher && (
            <div className="card" style={{ background: '#f3f7fc' }}>
              <h4 style={{ marginTop: 0 }}>Ուսուցչի լրացրած Ինքնանդրադարձը</h4>
              {reflections.length === 0 && (
                <p className="muted">Այս ուսուցիչը դեռևս ինքնանդրադարձ չի լրացրել։</p>
              )}
              {reflections.slice(0, 1).map((r) => (
                <div key={r._id}>
                  <p className="muted">
                    {new Date(r.date).toLocaleDateString('hy-AM')}
                    {r.subject ? ` · ${r.subject}` : ''}
                    {r.topic ? ` · ${r.topic}` : ''}
                    {r.grade ? ` · ${r.grade}` : ''}
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
          )}

          <div className="competency-row">
            <label>
              <span>Առարկա</span>
              <input value={header.subject} onChange={(e) => setHeader({ ...header, subject: e.target.value })} />
            </label>
            <label>
              <span>Դասարան</span>
              <input value={header.grade} onChange={(e) => setHeader({ ...header, grade: e.target.value })} />
            </label>
            <span />
          </div>
          <label>
            <span>Դասի պլանի հղում</span>
            <input
              value={header.lessonPlanLink}
              onChange={(e) => setHeader({ ...header, lessonPlanLink: e.target.value })}
              placeholder="Ինքնաշխատ կլցվի ուսուցչի ինքնանդրադարձից, եթե դատարկ թողնեք"
            />
          </label>
          <label>
            <span>Տեսաձայնագրության հղում</span>
            <input
              value={header.recordingLink}
              onChange={(e) => setHeader({ ...header, recordingLink: e.target.value })}
              placeholder="Ինքնաշխատ կլցվի ուսուցչի ինքնանդրադարձից, եթե դատարկ թողնեք"
            />
          </label>

          <div className="form-section">
            <h3>Ա. Դասապլանի և դասի պլանավորման ընդհանուր ակնկալիքներ</h3>
            <FlatRubricEditor
              value={planningRubric}
              onChange={setPlanningRubric}
              headlineLabel="Դասապլանի և դասի ընդհանուր պլանավորման դիտարկում"
            />
          </div>

          <div className="form-section">
            <h3>Բ. Դասալսման ընթացքում իրական ժամանակի ժրոնիկոն</h3>
            <table className="timeline-table">
              <thead>
                <tr>
                  <th>Փուլ</th>
                  <th>Ուսուցչի գործողություններ</th>
                  <th>Սովորողների գործողություններ</th>
                  <th>Հարցեր/դիտարկումներ</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((row, i) => (
                  <tr key={row.phase || i}>
                    <td>
                      <strong>{TIMELINE_PHASES[i] || row.phase}</strong>
                    </td>
                    <td>
                      <textarea
                        value={row.teacherActions}
                        onChange={(e) => updateTimelineCell(i, 'teacherActions', e.target.value)}
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.studentActions}
                        onChange={(e) => updateTimelineCell(i, 'studentActions', e.target.value)}
                      />
                    </td>
                    <td>
                      <textarea
                        value={row.questionsObservations}
                        onChange={(e) => updateTimelineCell(i, 'questionsObservations', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-section">
            <h3>Գ. Դասավանդման Ընդհանուր Ակնկալիքների Գնահատման Բաղադրիչներ</h3>
            <TeachingRubricEditor value={teachingRubric} onChange={setTeachingRubric} />
          </div>

          <div className="form-section">
            <h3>Դ. Քոուչինգի և Վերլուծական Զրույցի Բաժին</h3>
            <label>
              <span>Ի՞նչ զգացողություն ունեցիք դասի սկզբում</span>
              <textarea
                rows={2}
                value={coaching.feltAtStart}
                onChange={(e) => updateCoachingField('feltAtStart', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('feltAtStart', coaching.feltAtStart ? `${coaching.feltAtStart} ${t}` : t)} />
            </label>
            <label>
              <span>Ուսուցչի ինքնանդրադարձի ամփոփում</span>
              <textarea
                rows={3}
                value={coaching.selfReflectionSummary}
                onChange={(e) => updateCoachingField('selfReflectionSummary', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('selfReflectionSummary', coaching.selfReflectionSummary ? `${coaching.selfReflectionSummary} ${t}` : t)} />
            </label>
            <label>
              <span>Դիտարկված ուժեղ կողմեր</span>
              <textarea
                rows={3}
                value={coaching.strengthsObserved}
                onChange={(e) => updateCoachingField('strengthsObserved', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('strengthsObserved', coaching.strengthsObserved ? `${coaching.strengthsObserved} ${t}` : t)} />
            </label>
            <label>
              <span>Դիտարկված բարելավման ուղղություններ</span>
              <textarea
                rows={3}
                value={coaching.improvementsObserved}
                onChange={(e) => updateCoachingField('improvementsObserved', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('improvementsObserved', coaching.improvementsObserved ? `${coaching.improvementsObserved} ${t}` : t)} />
            </label>
            <label>
              <span>Հարցեր ուսուցչի համար</span>
              <textarea
                rows={3}
                value={coaching.questionsForTeacher}
                onChange={(e) => updateCoachingField('questionsForTeacher', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('questionsForTeacher', coaching.questionsForTeacher ? `${coaching.questionsForTeacher} ${t}` : t)} />
            </label>
            <label>
              <span>Գործնական աշխատանքի պլան</span>
              <textarea
                rows={3}
                value={coaching.practicalWorkPlan}
                onChange={(e) => updateCoachingField('practicalWorkPlan', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('practicalWorkPlan', coaching.practicalWorkPlan ? `${coaching.practicalWorkPlan} ${t}` : t)} />
            </label>
            <label>
              <span>Ի՞նչ զգացողություն ունեցիք քննարկման ավարտին</span>
              <textarea
                rows={2}
                value={coaching.feltAtEnd}
                onChange={(e) => updateCoachingField('feltAtEnd', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('feltAtEnd', coaching.feltAtEnd ? `${coaching.feltAtEnd} ${t}` : t)} />
            </label>

            <p className="form-section-hint">
              <strong>Նպատակի և նպատակին հասնելու գործողությունների սահմանում</strong> ՈՒԱ-ի հետ, լրացնել ներքևում.
            </p>
            <table className="goals-table">
              <thead>
                <tr>
                  <th>Նպատակ</th>
                  <th>Հասնելու քայլեր</th>
                </tr>
              </thead>
              <tbody>
                {coaching.goals.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <textarea value={row.goal} onChange={(e) => updateCoachingGoalRow(i, 'goal', e.target.value)} />
                    </td>
                    <td>
                      <textarea value={row.steps} onChange={(e) => updateCoachingGoalRow(i, 'steps', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <label>
              <span>Ռեսուրսներ և ուղղորդում</span>
              <textarea
                rows={3}
                value={coaching.resourcesAndGuidance}
                onChange={(e) => updateCoachingField('resourcesAndGuidance', e.target.value)}
              />
              <VoiceToTextButton onTranscript={(t) => updateCoachingField('resourcesAndGuidance', coaching.resourcesAndGuidance ? `${coaching.resourcesAndGuidance} ${t}` : t)} />
            </label>
          </div>

          <div className="form-section">
            <h3>Ե. Դասի պլանավորման, ինքնանդրադարձի, վերլուծության և առաջխաղացման ընդհանուր ակնկալիքներ</h3>
            <p className="muted form-section-hint">
              Լրացվում է դասալսողի/ԱԶՂ-ի կողմից՝ դասապլանի, ինքնանդրադարձի և դասի վերլուծության դիտարկման ու ամփոփման արդյունքում։
            </p>
            <FlatRubricEditor value={overallExpectations} onChange={setOverallExpectations} />
          </div>

          <div className="rubric-summary">
            <span className="score-pill score-pill-lg">
              Դասապլանի և դասի դիտարկման ձևաթղթի ընդհանուր միջին՝{' '}
              {(() => {
                const avgs = [planningRubric.overallAverage, teachingRubric.overallAverage, overallExpectations.overallAverage].filter(
                  (n) => typeof n === 'number'
                );
                return avgs.length ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2) : '—';
              })()}
              /5
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}
          {notice && <p className="muted">{notice}</p>}
          {sent && <p className="muted">Այս ձևաթուղթն արդեն ուղարկված է ուսուցչին։</p>}

          <div className="competency-row" style={{ gridTemplateColumns: 'auto auto auto' }}>
            <button type="submit" disabled={saving}>
              {saving ? 'Պահպանվում է...' : 'Պահպանել'}
            </button>
            <button type="button" className="secondary" onClick={handleSend} disabled={sending || !observationId || sent}>
              {sending ? 'Ուղարկվում է...' : 'Ուղարկել'}
            </button>
            {observationId && (
              <button type="button" className="secondary" onClick={resetForm}>
                + Նոր դիտարկում
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Նախորդ դիտարկումները</h3>
        {observations.length === 0 && <p className="muted">Դիտարկում դեռևս չկա։</p>}
        {observations.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Ամսաթիվ</th>
                <th>Ուսուցիչ</th>
                <th>Առարկա / Դասարան</th>
                <th>Ընդհանուր միջին</th>
                <th>Կարգավիճակ</th>
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
                    <span className="score-pill">{o.grandAverage ?? '—'}/5</span>
                  </td>
                  <td>{o.sent ? 'Ուղարկված' : 'Սևագիր'}</td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button type="button" className="secondary" onClick={() => editObservation(o._id)}>
                      Խմբագրել
                    </button>
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
        )}
      </div>
    </div>
  );
}
