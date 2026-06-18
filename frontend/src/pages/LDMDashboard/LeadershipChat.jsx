import { useEffect, useRef, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import VoiceToTextButton from '../../components/UI/VoiceToTextButton';

/**
 * The spec's "chat" for sorting leadership-competency manifestations:
 * the coach types one observed behavior at a time, Gemini classifies it
 * into one of the 18 fixed competencies, and the right-hand panel shows
 * every manifestation "sitting" inside its competency bucket.
 */
export default function LeadershipChat() {
  const [teachers, setTeachers] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [period, setPeriod] = useState('');
  const [messages, setMessages] = useState([]);
  const [grouped, setGrouped] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    axiosClient
      .get('/ldm/teachers')
      .then(({ data }) => setTeachers(data.teachers))
      .catch(() => setError('Չհաջողվեց բեռնել ուսուցիչների ցանկը'));
  }, []);

  const loadHistory = async (id, p) => {
    if (!id) {
      setMessages([]);
      setGrouped(null);
      return;
    }
    const { data } = await axiosClient.get('/ai/manifestations', {
      params: { teacher: id, period: p || undefined },
    });
    setMessages(data.manifestations);
    setGrouped(data.grouped);
  };

  useEffect(() => {
    loadHistory(teacherId, period).catch(() => setError('Չհաջողվեց բեռնել պատմությունը'));
  }, [teacherId, period]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!teacherId || !input.trim()) return;
    setSending(true);
    setError('');
    try {
      await axiosClient.post('/ai/manifestations', { teacher: teacherId, period, text: input });
      setInput('');
      await loadHistory(teacherId, period);
    } catch (err) {
      setError(err.response?.data?.message || 'Չհաջողվեց դասակարգել գրառումը');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>Դրսևորումների չատ (AI դասակարգում)</h2>
        <p className="muted">
          Մուտքագրեք ուսուցչի մոտ նկատված առաջնորդական դրսևորումը մեկ-մեկ։ AI-ն ինքնաբերաբար կդասակարգի
          այն 18 կարողունակություններից մեկում, և այն կնստի համապատասխան բաժնում։
        </p>
        <div className="competency-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
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
          <label>
            <span>Ժամանակահատված (ոչ պարտադիր)</span>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="օր.՝ 2026 Q1" />
          </label>
        </div>
      </div>

      {teacherId && (
        <div className="chat-layout">
          <div className="card chat-window">
            <div className="chat-messages">
              {messages.length === 0 && <p className="muted">Դեռևս գրառում չկա այս ուսուցչի համար։</p>}
              {messages.map((m) => (
                <div key={m._id} className="chat-bubble">
                  <p className="chat-bubble-text">{m.text}</p>
                  {m.competency ? (
                    <p className="chat-bubble-meta">
                      ➜ դասակարգված որպես՝ <strong>{m.competency}</strong>
                      {m.categoryName ? ` (${m.categoryName})` : ''}
                    </p>
                  ) : (
                    <p className="chat-bubble-meta muted">Չհաջողվեց հստակ դասակարգել</p>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={handleSend} className="chat-input-row">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Մուտքագրեք նկատված դրսևորումը..."
              />
              <VoiceToTextButton onTranscript={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))} />
              <button type="submit" disabled={sending || !input.trim()}>
                {sending ? 'Ուղարկվում է...' : 'Ուղարկել'}
              </button>
            </form>
            {error && <p className="error-text">{error}</p>}
          </div>

          <div className="card chat-grouped">
            <h3 style={{ marginTop: 0 }}>Կարողունակություններում նստած դրսևորումներ</h3>
            {grouped?.categories.map((cat) => (
              <div key={cat.key} style={{ marginBottom: '0.8rem' }}>
                <p style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{cat.name}</p>
                {cat.rows.map((row) => (
                  <div key={row.name} style={{ marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600 }}>{row.name}</span>{' '}
                    <span className="score-pill">{row.manifestations?.length || 0}</span>
                    {row.manifestations?.length > 0 && (
                      <ul style={{ margin: '0.2rem 0 0 1rem', padding: 0 }}>
                        {row.manifestations.map((mf) => (
                          <li key={mf.id} style={{ fontSize: '0.85rem' }}>
                            {mf.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
