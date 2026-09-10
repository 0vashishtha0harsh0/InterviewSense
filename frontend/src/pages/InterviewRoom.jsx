import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import api from '../services/api.js';

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [speakStatus, setSpeakStatus] = useState('');

  const fetchSession = async () => {
    try {
      const res = await api.get(`/api/interviews/${id}`);
      setSession(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load interview');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSession(); }, [id]);

  const currentIdx = session?.current_question ?? 0;
  const questions = session?.questions ?? [];
  const currentQ = questions[currentIdx];
  const total = session?.question_count ?? questions.length;
  const completed = session?.status === 'completed' || currentIdx >= total;

  const speak = (text) => {
    if (!('speechSynthesis' in window)) { setSpeakStatus('TTS not supported'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setSpeakStatus('Speaking...');
    u.onend = () => setSpeakStatus('');
    u.onerror = () => setSpeakStatus('Speech error');
    window.speechSynthesis.speak(u);
  };
  const stopSpeak = () => { window.speechSynthesis.cancel(); setSpeakStatus(''); };

  // Auto-speak when question changes (if allowed)
  useEffect(() => {
    if (currentQ?.question_text && !completed) {
      // small delay to avoid overlap
      const t = setTimeout(() => speak(currentQ.question_text), 600);
      return () => clearTimeout(t);
    }
  }, [currentQ?._id]);

  const handleSubmit = async () => {
    setProcessing(true);
    try {
      const res = await api.post(`/api/interviews/${id}/submit-answer`);
      if (res.data.completed) {
        // Refresh then navigate to results after brief processing state
        await fetchSession();
        setTimeout(() => navigate(`/results/${id}`), 900);
      } else {
        await fetchSession();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit failed');
    } finally { setProcessing(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading interview...</div>;
  if (error) return <div style={{ maxWidth: 700, margin: '40px auto', padding: 20, background: '#fef2f2', borderRadius: 8 }}><p style={{ color: '#dc2626' }}>{error}</p><button onClick={()=>navigate('/dashboard')} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db' }}>Back to Dashboard</button></div>;
  if (completed) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Interview Completed ✓</h2>
        <p style={{ color: '#6b7280', marginTop: 8 }}>All {total} questions answered. Generating final performance dashboard...</p>
        <button onClick={()=>navigate(`/results/${id}`)} style={{ marginTop: 16, padding: '10px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>View Final Dashboard →</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Interview — {session.interview_type} ({session.domain})</h1>
        <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', padding: '6px 10px', borderRadius: 20 }}>Q {currentIdx + 1} / {total} • {session.difficulty}</span>
      </div>

      <div style={{ marginTop: 16, padding: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, letterSpacing: 0.5 }}>QUESTION {currentIdx + 1}</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginTop: 6, color: '#111827' }}>{currentQ?.question_text}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={()=>speak(currentQ?.question_text)} style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #a5b4fc', background: '#fff', cursor: 'pointer' }}>▶ Play</button>
            <button onClick={()=>speak(currentQ?.question_text)} style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>↻ Replay</button>
            <button onClick={stopSpeak} style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>■ Stop</button>
            <span style={{ fontSize: 13, color: '#6b7280', alignSelf: 'center' }}>{speakStatus}</span>
          </div>
        </div>

        <div style={{ marginTop: 16, height: 180, background: '#111827', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column' }}>
          <div>Camera Preview</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>(M4 will add MediaRecorder + Whisper, M6 CV)</div>
        </div>

        <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Answer Controls (M3 placeholder — no audio yet)</div>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>M4 will add mic/webcam recording. For M3, click Submit to simulate answer and advance (hidden scoring).</p>
          {processing ? (
            <div style={{ marginTop: 10, padding: 10, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, textAlign: 'center', color: '#92400e', fontWeight: 600 }}>Analyzing your response...</div>
          ) : (
            <button onClick={handleSubmit} style={{ marginTop: 10, width: '100%', padding: '10px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Submit Answer → Next Question</button>
          )}
          <p style={{ marginTop: 8, fontSize: 11, color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>No scores shown during interview — final dashboard only after completion (per spec §1A)</p>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ca3af' }}>
          <span>Session: {id.slice(0,8)}...</span><span>Progress: {currentIdx}/{total}</span>
        </div>
      </div>
    </div>
  );
}
