import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { Alert, Badge, Icon, PageHeader } from '../components/ui.jsx';

const TYPES = ['HR', 'Technical', 'Behavioral', 'Domain-specific'];
const DOMAINS = ['AI/ML', 'Computer Science', 'Software Development', 'General', 'Data Science', 'Web Development'];
const ROLES = ['ML Engineer', 'Software Developer', 'Data Scientist', 'Web Developer', 'General'];
const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', hint: 'Fundamentals' },
  { value: 'medium', label: 'Medium', hint: 'Balanced' },
  { value: 'hard', label: 'Hard', hint: 'Advanced' },
];

const STEP_ICONS = { easy: 'zap', medium: 'target', hard: 'sparkle' };

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    interview_type: 'Technical',
    domain: 'AI/ML',
    role: 'ML Engineer',
    difficulty: 'medium',
    question_count: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useResume, setUseResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeStatus, setResumeStatus] = useState('');
  const [resumeKeywords, setResumeKeywords] = useState(null);
  const [resumeBusy, setResumeBusy] = useState(false);
  const [timed, setTimed] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(90);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      setResumeStatus('Select a PDF or DOCX file first');
      return;
    }
    setResumeBusy(true);
    setResumeStatus('Uploading…');
    try {
      const fd = new FormData();
      fd.append('file', resumeFile);
      const res = await api.post('/api/resume/upload', fd, {
        headers: { 'Content-Type': undefined },
        transformRequest: [(d) => d],
      });
      setResumeKeywords(res.data.keywords);
      setResumeStatus(res.data.message);
    } catch (err) {
      setResumeStatus(err.response?.data?.detail || 'Resume upload failed');
    } finally {
      setResumeBusy(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (useResume && resumeFile && !resumeKeywords) {
        try {
          const fd = new FormData();
          fd.append('file', resumeFile);
          const up = await api.post('/api/resume/upload', fd, {
            headers: { 'Content-Type': undefined },
            transformRequest: [(d) => d],
          });
          setResumeKeywords(up.data.keywords);
        } catch {
          /* fall through — interview still works without resume */
        }
      }
      const payload = { ...form, use_resume: useResume, timed, time_per_question: timePerQuestion };
      const res = await api.post('/api/interviews', payload);
      navigate(`/interview/${res.data._id}`);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        (Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail) ||
          'Failed to create interview. Check your filters — there may not be enough questions for this combination.',
      );
    } finally {
      setLoading(false);
    }
  };

  const totalSeconds = form.question_count * (timed ? timePerQuestion : 90);
  const minutes = Math.round(totalSeconds / 60);

  return (
    <div className="page container">
      <PageHeader
        eyebrow="Interview configuration"
        title="Set up your mock interview"
        subtitle="Choose the track and difficulty. Questions are selected randomly without duplicates, and difficulty adapts as you answer."
        icon={<Icon name="wand" size={14} />}
        actions={
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/dashboard')}>
            <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
            Back to dashboard
          </button>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <div className="stack">
          {error && (
            <Alert tone="error" icon={<Icon name="close" size={16} />}>
              {error}
            </Alert>
          )}

          <section className="card card--pad rise rise-1">
            <div className="row" style={{ gap: 10, marginBottom: 20 }}>
              <span className="stat-icon">
                <Icon name="layers" size={16} />
              </span>
              <div>
                <div className="card-title">Interview track</div>
                <div className="card-sub">What kind of interview do you want to rehearse?</div>
              </div>
            </div>

            <div className="field">
              <span className="label">Interview type</span>
              <div className="grid grid-2" style={{ gap: 8 }}>
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`option-chip${form.interview_type === t ? ' is-active' : ''}`}
                    onClick={() => set('interview_type', t)}
                  >
                    <Icon name={form.interview_type === t ? 'check' : 'target'} size={15} />
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <span className="label">Difficulty</span>
              <div className="grid grid-3" style={{ gap: 8 }}>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    className={`option-chip${form.difficulty === d.value ? ' is-active' : ''}`}
                    onClick={() => set('difficulty', d.value)}
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                  >
                    <span className="row" style={{ gap: 7 }}>
                      <Icon name={STEP_ICONS[d.value]} size={15} />
                      {d.label}
                    </span>
                    <span className="tiny dim">{d.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="domain">
                  Domain
                </label>
                <select id="domain" className="select" value={form.domain} onChange={(e) => set('domain', e.target.value)}>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="label" htmlFor="role">
                  Target role
                </label>
                <select id="role" className="select" value={form.role} onChange={(e) => set('role', e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="card card--pad rise rise-2">
            <div className="row row--between row--wrap" style={{ marginBottom: 14 }}>
              <div className="row" style={{ gap: 10 }}>
                <span className="stat-icon">
                  <Icon name="chart" size={16} />
                </span>
                <div>
                  <div className="card-title">Length</div>
                  <div className="card-sub">Between 5 and 15 questions</div>
                </div>
              </div>
              <span className="pill">
                <span className="pill-tag">{form.question_count}</span> questions
              </span>
            </div>

            <input
              type="range"
              min={5}
              max={15}
              step={1}
              value={form.question_count}
              onChange={(e) => set('question_count', parseInt(e.target.value, 10) || 10)}
              style={{ width: '100%', accentColor: 'var(--indigo)', cursor: 'pointer' }}
              aria-label="Number of questions"
            />
            <div className="row row--between tiny dim" style={{ marginTop: 4 }}>
              <span>5 · quick</span>
              <span>10 · recommended</span>
              <span>15 · deep dive</span>
            </div>
          </section>

          <section className="card card--pad rise rise-3">
            <label className="check" style={{ alignItems: 'flex-start' }}>
              <input type="checkbox" checked={useResume} onChange={(e) => setUseResume(e.target.checked)} />
              <span>
                <span className="row" style={{ gap: 8 }}>
                  <Icon name="file" size={15} />
                  Use my resume for personalised questions
                </span>
                <span className="check-copy">
                  Detected technologies become tailored questions inside this interview. Keywords are
                  extracted locally — no external AI service is called.
                </span>
              </span>
            </label>

            {useResume && (
              <div style={{ marginTop: 18 }}>
                <div className="field" style={{ marginBottom: 10 }}>
                  <span className="label">Resume file</span>
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      setResumeFile(e.target.files[0]);
                      setResumeKeywords(null);
                      setResumeStatus('');
                    }}
                  />
                </div>

                <div className="btn-row">
                  <button type="button" className="btn btn--outline btn--sm" onClick={handleResumeUpload} disabled={!resumeFile || resumeBusy}>
                    {resumeBusy ? <span className="spinner spinner--sm" /> : <Icon name="plus" size={14} />}
                    {resumeBusy ? 'Uploading…' : 'Upload & detect skills'}
                  </button>
                  {resumeFile && <span className="small dim row" style={{ gap: 7 }}><Icon name="file" size={13} />{resumeFile.name}</span>}
                </div>

                {resumeStatus && (
                  <div style={{ marginTop: 12 }}>
                    <Alert
                      tone={resumeKeywords ? 'success' : resumeBusy ? 'info' : 'error'}
                      icon={<Icon name={resumeKeywords ? 'check' : 'file'} size={15} />}
                    >
                      {resumeStatus}
                    </Alert>
                  </div>
                )}

                {resumeKeywords?.technologies?.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div className="label" style={{ marginBottom: 8 }}>
                      Detected technologies ({resumeKeywords.technologies.length})
                    </div>
                    <div className="gap-list">
                      {resumeKeywords.technologies.map((t) => (
                        <span key={t} className="chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="card card--pad rise rise-4">
            <label className="check" style={{ alignItems: 'flex-start' }}>
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
              <span>
                <span className="row" style={{ gap: 8 }}>
                  <Icon name="clock" size={15} />
                  Time-bound questions
                </span>
                <span className="check-copy">
                  Recording starts automatically and a countdown auto-submits when time runs out.
                  Manual submit still works at any moment.
                </span>
              </span>
            </label>

            {timed && (
              <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
                <label className="label" htmlFor="timePerQuestion">
                  Time per question
                </label>
                <select
                  id="timePerQuestion"
                  className="select"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(parseInt(e.target.value, 10))}
                >
                  <option value={30}>30 seconds — rapid fire</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds — recommended</option>
                  <option value={120}>120 seconds</option>
                  <option value={180}>180 seconds</option>
                </select>
              </div>
            )}
          </section>
        </div>

        {/* ---------- live summary ---------- */}
        <aside className="stack" style={{ position: 'sticky', top: 'calc(var(--nav-h) + 20px)' }}>
          <section className="card card--pad card--accent rise rise-2">
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Session summary
            </div>

            <div className="stack stack--sm" style={{ gap: 2 }}>
              {[
                { k: 'Track', v: form.interview_type, icon: 'layers' },
                { k: 'Domain', v: form.domain, icon: 'book' },
                { k: 'Role', v: form.role, icon: 'user' },
                { k: 'Difficulty', v: form.difficulty, icon: 'target' },
                { k: 'Questions', v: String(form.question_count), icon: 'chart' },
                {
                  k: 'Est. duration',
                  v: `~${minutes} min`,
                  icon: 'clock',
                },
              ].map((r) => (
                <div
                  key={r.k}
                  className="row row--between"
                  style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}
                >
                  <span className="small row" style={{ gap: 9, color: 'var(--text-3)' }}>
                    <Icon name={r.icon} size={14} />
                    {r.k}
                  </span>
                  <span className="small strong truncate" style={{ color: 'var(--text)', textTransform: 'capitalize' }}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>

            <div className="row row--wrap" style={{ gap: 8, marginTop: 16 }}>
              {useResume && <Badge tone="violet"><Icon name="file" size={12} /> Resume-aware</Badge>}
              {timed && <Badge tone="warn"><Icon name="clock" size={12} /> Timed {timePerQuestion}s</Badge>}
              <Badge tone="info"><Icon name="zap" size={12} /> Adaptive</Badge>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--lg btn--block"
              style={{ marginTop: 22 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner--sm" />
                  Creating interview…
                </>
              ) : (
                <>
                  Start interview
                  <Icon name="arrow" size={17} />
                </>
              )}
            </button>
          </section>

          <section className="card card--pad rise rise-3">
            <div className="row" style={{ gap: 10, marginBottom: 12 }}>
              <Icon name="lock" size={16} />
              <span className="card-title" style={{ fontSize: '.94rem' }}>
                Before you begin
              </span>
            </div>
            <ul className="auth-list">
              {[
                'Allow camera and microphone access when prompted.',
                'Sit facing a light source with your face centred in the oval.',
                'Speak clearly — answers are transcribed and scored after you submit.',
                'No scores or feedback appear until the final question.',
              ].map((t) => (
                <li key={t} style={{ fontSize: '.8rem' }}>
                  <span className="auth-check">
                    <Icon name="check" size={11} strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
