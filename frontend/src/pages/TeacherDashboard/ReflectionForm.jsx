import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import VoiceToTextButton from '../../components/UI/VoiceToTextButton';

export default function ReflectionForm() {
  const [content, setContent] = useState('');
  const [moodRating, setMoodRating] = useState(3);
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
    loadReflections().catch(() => setError('Failed to load reflections'));
  }, []);

  const handleVoiceTranscript = (text) => {
    setInputMethod('voice');
    setContent((prev) => (prev ? `${prev} ${text}` : text));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      await axiosClient.post('/teacher/reflections', { content, moodRating, inputMethod });
      setContent('');
      setInputMethod('text');
      setMoodRating(3);
      await loadReflections();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reflection');
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
      setError('Failed to generate AI feedback');
    } finally {
      setFeedbackLoadingId(null);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Daily Reflection</h2>
        <form onSubmit={handleSubmit}>
          <label>
            <span>How did today go?</span>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => {
                setInputMethod('text');
                setContent(e.target.value);
              }}
              placeholder="What went well? What was challenging? What will you try tomorrow?"
              required
            />
          </label>
          <label>
            <span>Self-rating: {moodRating}/5</span>
            <input
              type="range"
              min={1}
              max={5}
              value={moodRating}
              onChange={(e) => setMoodRating(Number(e.target.value))}
            />
          </label>
          <div style={{ marginBottom: '0.9rem' }}>
            <VoiceToTextButton onTranscript={handleVoiceTranscript} />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Saving…' : 'Save reflection'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Past reflections</h3>
        {reflections.length === 0 && <p className="muted">No reflections yet.</p>}
        {reflections.map((r) => (
          <div key={r._id} className="card" style={{ background: '#fafbfc' }}>
            <p className="muted">
              {new Date(r.date).toLocaleDateString()} · self-rating {r.moodRating ?? '—'}/5 ·{' '}
              {r.inputMethod}
            </p>
            <p>{r.content}</p>
            {r.aiFeedback ? (
              <p>
                <strong>AI coaching feedback:</strong> {r.aiFeedback}
              </p>
            ) : (
              <button
                type="button"
                className="secondary"
                onClick={() => requestFeedback(r._id)}
                disabled={feedbackLoadingId === r._id}
              >
                {feedbackLoadingId === r._id ? 'Generating…' : 'Get AI feedback'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
