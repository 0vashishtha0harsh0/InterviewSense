import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import api from '../services/api.js';
import { Badge, Icon, Loader } from '../components/ui.jsx';

const PROC_STEPS = ['Uploading', 'Transcribing', 'Analysing content', 'Vision & scoring'];

function stepIndex(processingStep) {
  const s = (processingStep || '').toLowerCase();
  if (s.includes('upload')) return 0;
  if (s.includes('transcrib')) return 1;
  if (s.includes('analyz') || s.includes('analys')) return 2;
  return 0;
}

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
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSession();
  }, [id]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
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
    if (!('speechSynthesis' in window)) {
      setSpeakStatus('TTS not supported');
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onstart = () => setSpeakStatus('Speaking…');
    u.onend = () => setSpeakStatus('');
    u.onerror = () => setSpeakStatus('Speech error');
    window.speechSynthesis.speak(u);
  };
  const stopSpeak = () => {
    window.speechSynthesis.cancel();
    setSpeakStatus('');
  };
  useEffect(() => {
    if (currentQ?.question_text && !completed) {
      const t = setTimeout(() => speak(currentQ.question_text), 700);
      return () => clearTimeout(t);
    }
  }, [currentQ?._id]);

  const initMedia = async () => {
    setRecordError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
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
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }
    autoSubmitRef.current = false;
    try {
      let stream = streamRef.current;
      if (!stream || !stream.active) stream = await initMedia();
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) mimeType = 'video/webm;codecs=vp9';
      else if (MediaRecorder.isTypeSupported('video/webm')) mimeType = 'video/webm';
      else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      // Reduced bitrate keeps files under 30MB even for 180s timed recordings.
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 600000, audioBitsPerSecond: 64000 });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        if (chunksRef.current.length === 0) {
          setRecordError('Empty recording — please try again and speak.');
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          setRecordError('Recording too short/empty. Please record again.');
          return;
        }
        setRecordedBlob(blob);
        recordedUrlRef.current = URL.createObjectURL(blob);
        if (autoSubmitRef.current) {
          autoSubmitRef.current = false;
          setTimeout(() => handleSubmitWithBlob(blob), 300);
        }
      };
      recorder.start(100);
      setIsRecording(true);
      setDuration(0);
      durationTimerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
      if (previewRef.current) previewRef.current.srcObject = stream;
    } catch {
      /* error already surfaced through recordError */
    }
  }, [isRecording, processing]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
  };

  // Auto-start recording when a question loads (no prep pause) + init media on first load.
  useEffect(() => {
    if (loading || completed || !session) return;
    if (hasPermission === null) {
      initMedia()
        .catch(() => {})
        .finally(() => {
          setTimeout(() => startRecording(), 800);
        });
    } else if (hasPermission === true && !isRecording && !recordedBlob && !processing) {
      const t = setTimeout(() => startRecording(), 600);
      return () => clearTimeout(t);
    }
  }, [currentIdx, session?._id, loading, hasPermission]);

  // Timer countdown for timed mode.
  useEffect(() => {
    if (!isTimed || completed || loading || !session) return;
    setTimeLeft(timePerQ);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return timePerQ;
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          if (isRecording) {
            autoSubmitRef.current = true;
            stopRecording();
          } else if (recordedBlob) {
            const sizeMB = recordedBlob.size / 1024 / 1024;
            if (sizeMB > 28) setTimeout(() => handleSkipAndContinue(), 200);
            else setTimeout(() => handleSubmitWithBlob(recordedBlob), 200);
          } else {
            setTimeout(() => handleSubmitAutoFallback(), 200);
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
    const sizeMB = blob.size / 1024 / 1024;
    if (sizeMB > 28) {
      setError(`Audio too large (${sizeMB.toFixed(1)}MB > 28MB). Your ${duration}s recording is too long/high quality.`);
      if (autoSubmitRef.current || (isTimed && timeLeft === 0)) {
        setTimeout(() => handleSkipAndContinue(), 500);
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
      await new Promise((r) => setTimeout(r, 400));
      if (res.data.completed) {
        await fetchSession();
        setTimeout(() => navigate(`/results/${id}`), 800);
      } else {
        setRecordedBlob(null);
        if (recordedUrlRef.current) {
          URL.revokeObjectURL(recordedUrlRef.current);
          recordedUrlRef.current = null;
        }
        setDuration(0);
        setTimeLeft(isTimed ? timePerQ : null);
        await fetchSession();
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail;
      if (msg && msg.includes('too large')) {
        setError(`${msg} — Click 'Next → Skip & Continue' to move to next question without this audio.`);
        setRecordError('Recording too large — please re-record shorter or skip.');
      } else if (Array.isArray(detail)) setError(detail.map((d) => d.msg).join(', '));
      else setError(msg || 'Submit failed — try again.');
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  const handleSubmitAutoFallback = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      const res = await api.post(
        `/api/interviews/${id}/submit-answer`,
        {},
        { headers: { 'Content-Type': 'application/json' } },
      );
      if (res.data.completed) {
        await fetchSession();
        setTimeout(() => navigate(`/results/${id}`), 800);
      } else {
        await fetchSession();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Auto-submit failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!recordedBlob) {
      setRecordError('No recording found — recording was auto-started, please wait a moment or re-record.');
      return;
    }
    await handleSubmitWithBlob(recordedBlob);
  };

  const handleNextManual = () => {
    if (isRecording) {
      autoSubmitRef.current = false;
      stopRecording();
      setTimeout(() => handleSubmitAutoFallback(), 400);
      return;
    }
    if (recordedBlob) {
      const sizeMB = recordedBlob.size / 1024 / 1024;
      if (sizeMB > 28) {
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
    if (recordedBlob && recordedBlob.size / 1024 / 1024 > 28) {
      const ok = confirm(
        `Recording is ${(recordedBlob.size / 1024 / 1024).toFixed(1)}MB >30MB and would fail. Skip this answer and move to next question? (This will count as low score for this question but interview will continue)`,
      );
      if (!ok) return;
    }
    await handleSubmitAutoFallback();
    setRecordedBlob(null);
    if (recordedUrlRef.current) {
      URL.revokeObjectURL(recordedUrlRef.current);
      recordedUrlRef.current = null;
    }
    setDuration(0);
  };

  const mmss = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  /* ------------------------------- states ------------------------------- */
  if (loading) {
    return (
      <div className="page container">
        <Loader label="Loading your interview room…" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="page container container--narrow">
        <div className="card card--pad-lg center rise">
          <div className="empty-icon" style={{ margin: '0 auto 18px' }}>
            <Icon name="close" size={24} />
          </div>
          <h1 className="h2">We couldn’t open this interview</h1>
          <p className="muted" style={{ marginTop: 10 }}>{error}</p>
          <button type="button" className="btn btn--primary" style={{ marginTop: 22 }} onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="page container container--narrow">
        <div className="card card--pad-lg center rise">
          <div className="empty-icon" style={{ margin: '0 auto 18px' }}>
            <Icon name="check" size={24} />
          </div>
          <div className="eyebrow">All {total} questions answered</div>
          <h1 className="display-2" style={{ marginTop: 10 }}>
            Interview complete
          </h1>
          <p className="lead" style={{ marginTop: 12 }}>
            Your responses have been transcribed, evaluated and scored. The full performance
            dashboard is ready.
          </p>
          <div className="btn-row" style={{ justifyContent: 'center', marginTop: 26 }}>
            <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate(`/results/${id}`)}>
              View final dashboard
              <Icon name="arrow" size={17} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timerTone = timeLeft === null ? 'safe' : timeLeft <= 10 ? 'danger' : timeLeft <= 30 ? 'warn' : 'safe';
  const questionProgress = total ? (currentIdx / total) * 100 : 0;

  return (
    <div className="page container">
      {/* ----------------------------- header ----------------------------- */}
      <div className="stage-bar">
        <div className="stage-title">
          <Badge tone="info">
            <span className="dot" />
            Live session
          </Badge>
          <span className="h3">{session.interview_type}</span>
          <span className="dim small">{session.domain}</span>
          <span className="dim small">·</span>
          <span className="dim small">{session.role}</span>
          <Badge tone="neutral">{session.difficulty}</Badge>
          {isTimed && (
            <Badge tone="warn">
              <Icon name="clock" size={12} /> Timed {timePerQ}s / Q
            </Badge>
          )}
        </div>

        <div className="row" style={{ gap: 12 }}>
          {isTimed && timeLeft !== null && (
            <span className={`timer timer--${timerTone}`}>
              <Icon name="clock" size={15} />
              <span className="timer-value">{mmss(timeLeft)}</span>
            </span>
          )}
          <span className="pill">
            <span className="pill-tag">
              {currentIdx + 1} / {total}
            </span>
            questions
          </span>
        </div>
      </div>

      <div className="bar rise" style={{ marginBottom: 22, height: 5 }}>
        <div
          className={`bar-fill${isTimed && timeLeft !== null && timeLeft <= 30 ? ' bar-fill--warn' : ''}`}
          style={{
            width: isTimed && timeLeft !== null ? `${Math.min(100, ((timePerQ - timeLeft) / timePerQ) * 100)}%` : `${questionProgress}%`,
          }}
        />
      </div>

      <div className="stage-grid">
        {/* --------------------------- left column --------------------------- */}
        <div className="stack">
          <section className="question-card rise rise-1">
            <div className="q-eyebrow">
              <span className="q-index">Question {currentIdx + 1}</span>
              {speakStatus && (
                <span className="speak-status">
                  <span className="eq" aria-hidden="true">
                    <span style={{ height: '100%' }} />
                    <span style={{ height: '70%', animationDelay: '.15s' }} />
                    <span style={{ height: '95%', animationDelay: '.3s' }} />
                    <span style={{ height: '55%', animationDelay: '.45s' }} />
                  </span>
                  {speakStatus}
                </span>
              )}
            </div>

            <p className="q-text">{currentQ?.question_text}</p>

            <div className="q-tools">
              <button type="button" className="btn btn--outline btn--sm" onClick={() => speak(currentQ?.question_text)}>
                <Icon name="play" size={14} />
                Play
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => speak(currentQ?.question_text)}>
                <Icon name="replay" size={14} />
                Replay
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={stopSpeak}>
                <Icon name="stop" size={14} />
                Stop
              </button>
              {isTimed && timeLeft !== null && (
                <span className="speak-status">
                  · <Icon name="clock" size={13} /> {timeLeft}s left
                </span>
              )}
            </div>
          </section>

          {(recordError || error) && (
            <div className="stack stack--sm">
              {recordError && (
                <div className="alert alert--error">
                  <span className="alert-icon">
                    <Icon name="close" size={16} />
                  </span>
                  <div>
                    {recordError}
                    {recordError.includes('too large') && (
                      <div style={{ marginTop: 10 }}>
                        <button type="button" className="btn btn--sm btn--outline" onClick={handleSkipAndContinue}>
                          Skip &amp; continue
                          <Icon name="arrow" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {error && (
                <div className="alert alert--error">
                  <span className="alert-icon">
                    <Icon name="close" size={16} />
                  </span>
                  <div>
                    {error}
                    {error.includes('too large') && (
                      <div style={{ marginTop: 10 }}>
                        <button type="button" className="btn btn--sm btn--outline" onClick={handleSkipAndContinue}>
                          Skip &amp; continue
                          <Icon name="arrow" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <section className="card card--pad rise rise-2">
            <div className="ctrl-row" style={{ marginTop: 0 }}>
              {!isRecording ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ flex: '1 1 190px' }}
                  onClick={startRecording}
                  disabled={processing}
                >
                  <Icon name="mic" size={16} />
                  Start recording
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--danger"
                  style={{ flex: '1 1 190px' }}
                  onClick={stopRecording}
                >
                  <Icon name="stop" size={15} />
                  Stop recording
                </button>
              )}

              <button
                type="button"
                className="btn btn--success"
                style={{ flex: '1 1 190px' }}
                onClick={handleSubmit}
                disabled={processing || !recordedBlob || isRecording}
              >
                {processing ? <span className="spinner spinner--sm" /> : <Icon name="check" size={16} />}
                {processing ? 'Processing…' : 'Submit answer'}
              </button>

              <button
                type="button"
                className="btn btn--outline"
                onClick={handleNextManual}
                disabled={processing}
                title="Skip to the next question"
              >
                Next
                <Icon name="arrow" size={15} />
              </button>
            </div>

            <div className="row row--wrap" style={{ gap: 8, marginTop: 14 }}>
              <Badge tone={isRecording ? 'danger' : 'neutral'}>
                {isRecording ? (
                  <>
                    <span className="blink" /> Recording {mmss(duration)}
                  </>
                ) : recordedBlob ? (
                  <>
                    <Icon name="check" size={12} /> {Math.round(recordedBlob.size / 1024)} KB ready
                  </>
                ) : (
                  <>
                    <Icon name="mic" size={12} /> Waiting for audio
                  </>
                )}
              </Badge>
              {recordedBlob && !isRecording && (
                <Badge tone="info">
                  <Icon name="refresh" size={12} /> Re-record any time before submitting
                </Badge>
              )}
            </div>
          </section>

          {processing && (
            <section className="processing rise">
              <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
                <span className="spinner" />
                <strong style={{ fontSize: '.95rem' }}>{processingStep || 'Analysing your response…'}</strong>
              </div>
              <p className="small dim" style={{ marginTop: 8 }}>
                Your answer is processed after submission. Nothing is shown to you until the interview ends.
              </p>
              <div className="proc-steps">
                {PROC_STEPS.map((s, i) => {
                  const active = stepIndex(processingStep);
                  const done = i < active;
                  const isActive = i === active;
                  return (
                    <span key={s} className={`proc-step${isActive ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
                      <Icon name={done ? 'check' : isActive ? 'refresh' : 'clock'} size={12} />
                      {s}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          <div className="hidden-note">
            <Icon name="lock" size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            Scores stay hidden during the interview. Content, delivery and the full breakdown appear on the
            final dashboard only.
          </div>
        </div>

        {/* --------------------------- right column -------------------------- */}
        <div className="stack">
          <div className={`cam${isRecording ? ' cam--recording' : ''} rise rise-2`}>
            <video
              ref={previewRef}
              autoPlay
              muted
              playsInline
              className="cam-video"
              style={{ display: hasPermission === false ? 'none' : 'block' }}
            />

            {hasPermission === false && (
              <div className="cam-placeholder">
                <Icon name="video" size={30} />
                <div style={{ color: 'var(--rose)' }}>{recordError || 'Camera access denied'}</div>
                <p className="tiny">Camera and microphone are required for non-verbal analysis.</p>
                <button type="button" className="btn btn--outline btn--sm" onClick={() => initMedia()}>
                  <Icon name="refresh" size={14} />
                  Retry permission
                </button>
              </div>
            )}

            {hasPermission === null && (
              <div className="cam-placeholder">
                <span className="spinner spinner--lg" />
                <div>Initialising camera &amp; microphone…</div>
                <p className="tiny">Recording starts automatically on each question.</p>
              </div>
            )}

            {hasPermission !== false && <div className="face-oval" />}

            {hasPermission !== false && (
              <div className="cam-chip cam-chip--tc">
                <Icon name="target" size={12} />
                Centre your face in the oval
              </div>
            )}

            {isRecording && (
              <div className="cam-chip cam-chip--tl cam-chip--rec">
                <span className="rec-dot blink" />
                REC {mmss(duration)}
              </div>
            )}

            {!isRecording && hasPermission && !processing && (
              <div className="cam-chip cam-chip--tl">
                <span
                  className="dot"
                  style={{ background: recordedBlob ? 'var(--emerald)' : 'var(--amber)' }}
                />
                {recordedBlob ? 'Answer captured' : 'Standby'}
              </div>
            )}

            {recordedBlob && !isRecording && !processing && (
              <div className="cam-chip cam-chip--ready">
                Recorded {(recordedBlob.size / 1024).toFixed(0)} KB · {mmss(duration)} — submit or record again
              </div>
            )}

            {isTimed && timeLeft !== null && (
              <div className="cam-chip cam-chip--br" style={{ color: `var(--${timerTone === 'danger' ? 'rose' : timerTone === 'warn' ? 'amber' : 'emerald'})` }}>
                <Icon name="clock" size={12} />
                {timeLeft}s
              </div>
            )}

            {processing && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15,23,42,.55)',
                  backdropFilter: 'blur(6px)',
                  display: 'grid',
                  placeItems: 'center',
                  gap: 12,
                }}
              >
                <div className="stack stack--sm" style={{ alignItems: 'center' }}>
                  <span className="spinner spinner--lg" />
                  <span className="small">{processingStep || 'Analysing…'}</span>
                </div>
              </div>
            )}
          </div>

          <section className="card card--pad rise rise-3">
            <div className="row" style={{ gap: 10, marginBottom: 14 }}>
              <Icon name="sparkle" size={16} />
              <span className="card-title" style={{ fontSize: '.94rem' }}>
                Session checkpoints
              </span>
            </div>
            <div className="stack stack--sm">
              {[
                {
                  k: 'Camera & mic',
                  v: hasPermission === true ? 'Connected' : hasPermission === false ? 'Blocked' : 'Connecting…',
                  tone: hasPermission === true ? 'success' : hasPermission === false ? 'danger' : 'warn',
                },
                { k: 'Progress', v: `${currentIdx + 1} of ${total}`, tone: 'info' },
                { k: 'Difficulty', v: session.difficulty, tone: 'violet' },
                { k: 'Mode', v: isTimed ? `Timed · ${timePerQ}s` : 'Manual submit', tone: 'neutral' },
              ].map((r) => (
                <div key={r.k} className="row row--between">
                  <span className="small dim">{r.k}</span>
                  <Badge tone={r.tone}>{r.v}</Badge>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <p className="hint">
              Answers are analysed only after you submit. Temporary audio and video are removed once
              scoring completes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
