import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api.js';

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [speakStatus, setSpeakStatus] = useState('');

  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordError, setRecordError] = useState('');
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const durationTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const previewRef = useRef(null);
  const recordedUrlRef = useRef(null);
  const autoSubmitRef = useRef(false);

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

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (recordedUrlRef.current) URL.revokeObjectURL(recordedUrlRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const currentIdx = session?.current_question ?? 0;
  const questions = session?.questions ?? [];
  const currentQ = questions[currentIdx];
  const total = session?.question_count ?? questions.length;
  const completed = session?.status === 'completed' || currentIdx >= total;
  const isTimed = !!session?.timed;
  const timePerQ = session?.time_per_question || 90;

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
  useEffect(() => {
    if (currentQ?.question_text && !completed) {
      const t = setTimeout(() => speak(currentQ.question_text), 700);
      return () => clearTimeout(t);
    }
  }, [currentQ?._id]);

  const initMedia = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: true });
      streamRef.current = stream;
      setHasPermission(true);
      if (previewRef.current) previewRef.current.srcObject = stream;
      return stream;
    } catch (e) {
      setHasPermission(false);
      if (e.name === 'NotAllowedError') setRecordError('Microphone/Camera permission denied. Please allow in browser settings and reload.');
      else if (e.name === 'NotFoundError') setRecordError('No camera/microphone found.');
      else setRecordError(`Media error: ${e.message}`);
      throw e;
    }
  };

  const startRecording = useCallback(async () => {
    if (isRecording || processing) return;
    setRecordError('');
    setRecordedBlob(null);
    if (recordedUrlRef.current) { URL.revokeObjectURL(recordedUrlRef.current); recordedUrlRef.current = null; }
    autoSubmitRef.current = false;
    try {
      let stream = streamRef.current;
      if (!stream || !stream.active) stream = await initMedia();
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) mimeType = 'video/webm;codecs=vp9';
      else if (MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';
      else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      // Reduced bitrate to keep files under 30MB even for 180s timed recordings (~0.6 Mbps video + 64k audio)
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 600000, audioBitsPerSecond: 64000 });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        if (chunksRef.current.length === 0) { setRecordError('Empty recording — please try again and speak.'); return; }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) { setRecordError('Recording too short/empty. Please record again.'); return; }
        setRecordedBlob(blob);
        recordedUrlRef.current = URL.createObjectURL(blob);
        // If auto-submit was triggered by timer while stopping, submit now
        if (autoSubmitRef.current) {
          autoSubmitRef.current = false;
          setTimeout(() => handleSubmitWithBlob(blob), 300);
        }
      };
      recorder.start(100);
      setIsRecording(true);
      setDuration(0);
      durationTimerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
      if (previewRef.current) previewRef.current.srcObject = stream;
    } catch (e) {
      // error already set
    }
  }, [isRecording, processing]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
  };

  // Auto-start recording when question loads (no prep pause) + init media on first load
  useEffect(() => {
    if (loading || completed || !session) return;
    // Init media immediately on first question if not yet granted
    if (hasPermission === null) {
      initMedia().catch(()=>{}).finally(()=>{
        // Auto-start after media ready
        setTimeout(()=> startRecording(), 800);
      });
    } else if (hasPermission === true && !isRecording && !recordedBlob && !processing) {
      // Auto-start for new question
      const t = setTimeout(()=> startRecording(), 600);
      return ()=> clearTimeout(t);
    }
  }, [currentIdx, session?._id, loading, hasPermission]);

  // Timer countdown for timed mode
  useEffect(() => {
    if (!isTimed || completed || loading || !session) return;
    // Reset timer on question change
    setTimeLeft(timePerQ);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return timePerQ;
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          // Auto-next: stop recording if active, then submit
          if (isRecording) {
            autoSubmitRef.current = true;
            stopRecording();
          } else if (recordedBlob) {
            // Already has blob, auto submit — check size first
            const sizeMB = recordedBlob.size / 1024 / 1024;
            if (sizeMB > 28) {
              setTimeout(()=> handleSkipAndContinue(), 200);
            } else {
              setTimeout(()=> handleSubmitWithBlob(recordedBlob), 200);
            }
          } else {
            // No recording yet, try to submit empty will be handled as mock but we still auto-advance
            // Create a tiny silent blob fallback or just call submit without blob (will use mock)
            setTimeout(()=> handleSubmitAutoFallback(), 200);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownTimerRef.current);
  }, [currentIdx, isTimed, timePerQ, isRecording, recordedBlob]);

  const handleSubmitWithBlob = async (blob) => {
    if (processing) return;
    // Pre-check size (30MB limit) to give instant feedback before upload
    const sizeMB = blob.size / 1024 / 1024;
    if (sizeMB > 28) {
      setError(`Audio too large (${sizeMB.toFixed(1)}MB > 28MB). Your ${duration}s recording is too long/high quality.`);
      // Auto-skip if this was timer-triggered auto-submit
      if (autoSubmitRef.current || (isTimed && timeLeft === 0)) {
        setTimeout(()=> handleSkipAndContinue(), 500);
      }
      return;
    }
    setProcessing(true);
    setProcessingStep('Uploading...');
    setError('');
    setRecordError('');
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'answer.webm');
      setProcessingStep('Transcribing with Whisper (base→tiny fallback)...');
      const res = await api.post(`/api/interviews/${id}/submit-answer`, fd, {
        headers: { 'Content-Type': undefined },
        transformRequest: [(data) => data],
      });
      setProcessingStep('Analyzing response...');
      await new Promise(r => setTimeout(r, 400));
      if (res.data.completed) {
        await fetchSession();
        setTimeout(() => navigate(`/results/${id}`), 800);
      } else {
        setRecordedBlob(null);
        if (recordedUrlRef.current) { URL.revokeObjectURL(recordedUrlRef.current); recordedUrlRef.current = null; }
        setDuration(0);
        setTimeLeft(isTimed ? timePerQ : null);
        await fetchSession();
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d=>d.msg).join(', ') : detail;
      if (msg && msg.includes('too large')) {
        setError(`${msg} — Click 'Next → Skip & Continue' to move to next question without this audio.`);
        setRecordError('Recording too large — please re-record shorter or skip.');
      } else if (Array.isArray(detail)) setError(detail.map(d=>d.msg).join(', '));
      else setError(msg || 'Submit failed — try again.');
    } finally { setProcessing(false); setProcessingStep(''); }
  };

  const handleSubmitAutoFallback = async () => {
    // For timer auto-next when no blob: submit without audio (will be mock but still advances)
    if (processing) return;
    setProcessing(true);
    try {
      const res = await api.post(`/api/interviews/${id}/submit-answer`, {}, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.data.completed) {
        await fetchSession();
        setTimeout(() => navigate(`/results/${id}`), 800);
      } else {
        await fetchSession();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Auto-submit failed');
    } finally { setProcessing(false); }
  };

  const handleSubmit = async () => {
    if (!recordedBlob) { setRecordError('No recording found — recording was auto-started, please wait a moment or re-record.'); return; }
    await handleSubmitWithBlob(recordedBlob);
  };

  const handleNextManual = () => {
    // Manual Next button side: if blob too large or still recording, skip and proceed without audio
    if (isRecording) {
      autoSubmitRef.current = false;
      stopRecording();
      setTimeout(()=> handleSubmitAutoFallback(), 400);
      return;
    }
    if (recordedBlob) {
      const sizeMB = recordedBlob.size / 1024 / 1024;
      if (sizeMB > 28) {
        // Skip large audio, proceed without it
        handleSkipAndContinue();
        return;
      }
      handleSubmit();
    } else handleSubmitAutoFallback();
  };

  const handleSkipAndContinue = async () => {
    if (processing) return;
    setError('');
    setRecordError('');
    // Confirm skip if they had a large recording
    if (recordedBlob && recordedBlob.size / 1024 / 1024 > 28) {
      if (!confirm(`Recording is ${(recordedBlob.size/1024/1024).toFixed(1)}MB >30MB and would fail. Skip this answer and move to next question? (This will count as low score for this question but interview will continue)`)) return;
    }
    await handleSubmitAutoFallback();
    // Clear blob after skip
    setRecordedBlob(null);
    if (recordedUrlRef.current) { URL.revokeObjectURL(recordedUrlRef.current); recordedUrlRef.current = null; }
    setDuration(0);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading interview...</div>;
  if (error && !session) return <div style={{ maxWidth: 700, margin: '40px auto', padding: 20, background: '#fef2f2', borderRadius: 8 }}><p style={{ color: '#dc2626' }}>{error}</p><button onClick={()=>navigate('/dashboard')} style={{ marginTop: 12, padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db' }}>Back to Dashboard</button></div>;
  if (completed) {
    return (
      <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Interview Completed ✓</h2>
        <p style={{ color: '#6b7280', marginTop: 8 }}>All {total} questions answered. Generating final performance dashboard...</p>
        <button onClick={()=>navigate(`/results/${id}`)} style={{ marginTop: 16, padding: '10px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>View Final Dashboard →</button>
      </div>
    );
  }

  const timeColor = timeLeft !== null && timeLeft <= 10 ? '#ef4444' : timeLeft !== null && timeLeft <= 30 ? '#f59e0b' : '#4f46e5';
  const progressPct = isTimed && timeLeft !== null ? ((timePerQ - timeLeft) / timePerQ) * 100 : 0;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 15, fontWeight: 700 }}>Interview — {session.interview_type} ({session.domain}) {isTimed && <span style={{ marginLeft: 8, background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>⏱ Timed {timePerQ}s / Q</span>}</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isTimed && timeLeft !== null && <span style={{ fontSize: 13, fontWeight: 700, color: timeColor, background: '#fff', border: `2px solid ${timeColor}`, padding: '4px 10px', borderRadius: 20 }}>{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</span>}
          <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '6px 10px', borderRadius: 20 }}>Q {currentIdx + 1} / {total} • {session.difficulty}</span>
        </div>
      </div>
      {isTimed && <div style={{ marginTop: 8, height: 6, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${progressPct}%`, background: timeColor, transition: 'width 1s linear' }}></div></div>}

      <div style={{ marginTop: 12, padding: 14, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, letterSpacing: 0.5 }}>QUESTION {currentIdx + 1}</div>
          <p style={{ fontSize: 17, fontWeight: 600, marginTop: 6, color: '#111827' }}>{currentQ?.question_text}</p>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={()=>speak(currentQ?.question_text)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #a5b4fc', background: '#fff', cursor: 'pointer' }}>▶ Play</button>
            <button onClick={()=>speak(currentQ?.question_text)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>↻ Replay</button>
            <button onClick={stopSpeak} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>■ Stop</button>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{speakStatus} {isTimed && timeLeft!==null && `• ${timeLeft}s left`}</span>
          </div>
        </div>

        <div style={{ marginTop: 14, background: '#000', borderRadius: 12, overflow: 'hidden', position: 'relative', border: '2px solid #111827' }}>
          <video ref={previewRef} autoPlay muted playsInline style={{ width: '100%', height: 420, objectFit: 'cover', transform: 'scaleX(-1)', display: hasPermission===false ? 'none' : 'block', background: '#000' }} />
          {hasPermission===false && <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171', padding: 20, textAlign: 'center', flexDirection: 'column' }}><div>{recordError || 'Camera access denied'}</div><button onClick={()=>initMedia()} style={{ marginTop: 12, padding: '6px 12px', borderRadius: 6, background: '#fff', border: 'none', cursor: 'pointer' }}>Retry Permission</button></div>}
          {hasPermission===null && <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', flexDirection: 'column' }}>Initializing camera & mic... (auto-recording will start)</div>}
          {/* Face guide overlay */}
          {hasPermission!==false && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 220, height: 280, border: '2px dashed rgba(255,255,255,0.6)', borderRadius: '50% / 55%', pointerEvents: 'none' }}></div>}
          {hasPermission!==false && <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 11 }}>Center your face in the oval</div>}
          {isRecording && <div style={{ position: 'absolute', top: 12, left: 12, background: '#ef4444', color: '#fff', padding: '5px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', display: 'inline-block' }}></span> REC {Math.floor(duration/60)}:{String(duration%60).padStart(2,'0')} {isTimed && `• ${timeLeft}s`}</div>}
          {recordedBlob && !isRecording && !processing && <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: 8, borderRadius: 8, fontSize: 12, textAlign: 'center' }}>Recorded {(recordedBlob.size/1024).toFixed(0)} KB • {duration}s — ready to submit or will auto-next on timer</div>}
          {isTimed && <div style={{ position: 'absolute', bottom: 12, right: 12, background: timeColor, color: '#fff', padding: '6px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{timeLeft}s</div>}
        </div>

        {recordError && <div style={{ marginTop: 10, background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, fontSize: 13 }}>{recordError} {recordError.includes('too large') && <button onClick={handleSkipAndContinue} style={{ marginLeft: 8, padding: '4px 8px', background: '#fff', border: '1px solid #dc2626', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Skip & Continue →</button>}</div>}
        {error && <div style={{ marginTop: 10, background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, fontSize: 13 }}>{error} {error.includes('too large') && <button onClick={handleSkipAndContinue} style={{ marginLeft: 8, padding: '4px 8px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Skip & Continue →</button>}</div>}

        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isRecording ? (
            <button onClick={startRecording} disabled={processing} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: processing?'not-allowed':'pointer', opacity: processing?0.6:1 }}>⏺ Start Recording</button>
          ) : (
            <button onClick={stopRecording} style={{ flex: 1, padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>■ Stop Recording</button>
          )}
          <button onClick={handleSubmit} disabled={processing || !recordedBlob || isRecording} style={{ flex: 1, padding: '10px', background: !recordedBlob || isRecording ? '#9ca3af' : '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: !recordedBlob||isRecording?'not-allowed':'pointer' }}>{processing ? 'Processing...' : 'Submit Answer →'}</button>
          <button onClick={handleNextManual} disabled={processing} title="Manual Next (also auto on timer)" style={{ padding: '10px 14px', background: '#fff', border: '1px solid #4f46e5', color: '#4f46e5', borderRadius: 8, fontWeight: 600, cursor: processing?'not-allowed':'pointer' }}>Next →</button>
        </div>

        {processing && (
          <div style={{ marginTop: 10, padding: 12, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: '#92400e', fontSize: 13 }}>{processingStep || 'Analyzing your response...'}</div>
            <div style={{ fontSize: 11, color: '#b45309', marginTop: 4 }}>Transcribing • Evaluating content • Analyzing delivery • Calculating score (hidden until completion)</div>
          </div>
        )}

        {!processing && <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280', textAlign: 'center' }}>Recording auto-starts on each question {isTimed ? `• Auto-submits in ${timeLeft}s` : ''} • Preview mirrored • You can re-record before submit</div>}
        <p style={{ marginTop: 6, fontSize: 11, color: '#dc2626', fontWeight: 600, textAlign: 'center' }}>No scores shown during interview — final dashboard only after completion. {isTimed ? 'Timer auto-advances, manual Next also available.' : ''}</p>
      </div>
    </div>
  );
}
