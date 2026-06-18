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
      .catch(() => setError('Failed to load teachers'));
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
    loadDiary(teacherId).catch(() => setError('Failed to load diary'));
  }, [teacherId]);

  const handleGenerate = async () => {
    if (!teacherId) return;
    setGenerating(true);
    setError('');
    try {
      await axiosClient.post('/ai/diary', { teacher: teacherId, days });
      await loadDiary(teacherId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate diary entry');
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
      setError('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>AI Diary</h2>
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

        {teacherId && (
          <>
            <label>
              <span>Look back over the last (days)</span>
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
              {generating ? 'Generating…' : 'Generate AI diary entry'}
            </button>
          </>
        )}
      </div>

      {teacherId && (
        <div className="card">
          <h3>Quick note about this teacher</h3>
          <p className="muted">Notes you add here feed into future AI diary summaries.</p>
          <form onSubmit={handleAddNote}>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            <div style={{ margin: '0.6rem 0' }}>
              <VoiceToTextButton onTranscript={(text) => setNote((n) => (n ? `${n} ${text}` : text))} />
            </div>
            <button type="submit" disabled={savingNote || !note.trim()}>
              {savingNote ? 'Saving…' : 'Add note'}
            </button>
          </form>
        </div>
      )}

      {teacherId && (
        <div className="card">
          <h3>Diary history</h3>
          {entries.length === 0 && <p className="muted">No AI diary entries generated yet.</p>}
          {entries.map((entry) => (
            <div key={entry._id} className="card" style={{ background: '#fafbfc' }}>
              <p className="muted">{new Date(entry.date).toLocaleString()}</p>
              <p>{entry.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
