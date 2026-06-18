import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import VoiceToTextButton from '../../components/UI/VoiceToTextButton';

export default function AiDiary() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [days, setDays] = useState(14);
  const [entries, setEntries] = useState([]);
  const [note, setNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosClient
      .get('/ldm/teachers')
      .then(({ data }) => setTeachers(data.teachers))
      .catch(() => setError('Չհաջողվեց բեռնել ուսուցիչների ցանկը'));
  }, []);

  const loadDiary = async (id) => {
    if (!id) {
      setEntries([]);
      return;
    }
    const { data } = await axiosClient.get('/ai/diary', { params: { teacher: id } });
    setEntries(data.entries);
  };

  useEffect(() => {
    loadDiary(teacherId).catch(() => setError('Չհաջողվեց բեռնել օրագիրը'));
  }, [teacherId]);

  const handleGenerate = async () => {
    if (!teacherId) return;
    setGenerating(true);
    setError('');
    try {
      await axiosClient.post('/ai/diary', { teacher: teacherId, days });
      await loadDiary(teacherId);
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց ստեղծել օրագրի գրառում');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!teacherId || !note.trim()) return;
    setSavingNote(true);
    try {
      await axiosClient.post('/ldm/notes', { teacher: teacherId, note });
      setNote('');
    } catch {
      setError('Չհաջողվեց պահպանել գրառումը');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>AI օրագիր</h2>
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
          <>
            <label>
              <span>Վերլուծել վերջին (օրեր)</span>
              <input
                type="number"
                min={1}
                max={90}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button type="button" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Ստեղծվում է...' : 'Ստեղծել AI օրագրի գրառում'}
            </button>
          </>
        )}
      </div>

      {teacherId && (
        <div className="card">
          <h3>Արագ գրառում այս ուսուցչի մասին</h3>
          <p className="muted">Այստեղ ավելացված գրառումները կօգտագործվեն հետագա AI օրագրի ամփոփումներում։</p>
          <form onSubmit={handleAddNote}>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <div style={{ margin: '0.6rem 0' }}>
              <VoiceToTextButton onTranscript={(text) => setNote((n) => (n ? `${n} ${text}` : text))} />
            </div>
            <button type="submit" disabled={savingNote || !note.trim()}>
              {savingNote ? 'Պահպանվում է...' : 'Ավելացնել գրառում'}
            </button>
          </form>
        </div>
      )}

      {teacherId && (
        <div className="card">
          <h3>Օրագրի պատմություն</h3>
          {entries.length === 0 && <p className="muted">Դեռևս AI օրագրի գրառում չկա։</p>}
          {entries.map((entry) => (
            <div key={entry._id} className="card" style={{ background: '#fafbfc' }}>
              <p className="muted">{new Date(entry.date).toLocaleString('hy-AM')}</p>
              <p>{entry.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
