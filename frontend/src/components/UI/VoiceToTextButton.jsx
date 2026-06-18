import { useRef, useState } from 'react';

const getRecognitionClass = () =>
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * Records speech via the browser's Web Speech API and appends the
 * transcript through `onTranscript`. Defaults to Armenian (hy-AM).
 * Degrades gracefully (a note instead of a button) in browsers that
 * don't support SpeechRecognition, e.g. Firefox.
 *
 * Usage: <VoiceToTextButton onTranscript={(text) => setContent((c) => `${c} ${text}`)} />
 */
export default function VoiceToTextButton({ onTranscript, lang = 'hy-AM' }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const SpeechRecognitionClass = getRecognitionClass();

  if (!SpeechRecognitionClass) {
    return <span className="muted">Ձայնային մուտքագրումը այս դիտարկիչում հասանելի չէ։</span>;
  }

  const startListening = () => {
    setError('');
    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ');
      onTranscript?.(transcript);
    };

    recognition.onerror = (event) => {
      setError(`Ձայնագրման սխալ՝ ${event.error}`);
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <span>
      <button
        type="button"
        className="secondary"
        onClick={listening ? stopListening : startListening}
      >
        {listening ? '⏹ Կանգնեցնել ձայնագրումը' : '🎤 Խոսել'}
      </button>
      {error && <span className="error-text"> {error}</span>}
    </span>
  );
}
