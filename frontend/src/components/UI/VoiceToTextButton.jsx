import { useRef, useState } from 'react';

const getRecognitionClass = () =>
  typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * Records speech via the browser's Web Speech API and appends the
 * transcript through `onTranscript`. Degrades gracefully (disabled button
 * with a note) in browsers that don't support SpeechRecognition, e.g. Firefox.
 *
 * Usage: <VoiceToTextButton onTranscript={(text) => setContent((c) => `${c} ${text}`)} />
 */
export default function VoiceToTextButton({ onTranscript, lang = 'en-US' }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const SpeechRecognitionClass = getRecognitionClass();

  if (!SpeechRecognitionClass) {
    return <span className="muted">Voice input isn&apos;t supported in this browser.</span>;
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
      setError(`Voice input error: ${event.error}`);
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
        {listening ? '⏹ Stop recording' : '🎤 Speak'}
      </button>
      {error && <span className="error-text"> {error}</span>}
    </span>
  );
}
