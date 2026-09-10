import { useParams } from 'react-router-dom';
export default function InterviewRoom() {
  const { id } = useParams();
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Interview Room — {id || 'M3'}</h1>
      <div style={{ marginTop: 16, padding: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <p style={{ color: '#6b7280' }}>M3: Question display + TTS + MediaRecorder. M4: Submit→Whisper. M5/M6 hidden scoring.</p>
        <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
          <strong>Q 1 / 10</strong>
          <p style={{ marginTop: 8 }}>Question will appear here with <code>window.speechSynthesis</code> controls (Play/Replay/Stop) — M3/M4</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button disabled style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db' }}>▶ Play Question</button>
            <button disabled style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db' }}>⏺ Start Answer</button>
            <button disabled style={{ padding: '8px 14px', borderRadius: 6, background: '#4f46e5', color: '#fff', border: 'none' }}>Submit Answer</button>
          </div>
          <div style={{ marginTop: 16, height: 180, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Camera Preview (M3+MediaPipe)</div>
          <p style={{ marginTop: 12, fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Critical UX: NO scores/feedback shown here — only neutral "Analyzing..." then next question. Final dashboard after completion.</p>
        </div>
      </div>
    </div>
  );
}
