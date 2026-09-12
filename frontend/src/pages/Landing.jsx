import { Link } from 'react-router-dom';
import { Icon } from '../components/ui.jsx';

const FEATURES = [
  {
    icon: 'mic',
    title: 'Voice-first interview room',
    body: 'Questions are spoken aloud with in-browser speech synthesis while the candidate answers on camera and microphone.',
  },
  {
    icon: 'zap',
    title: 'Whisper speech-to-text',
    body: 'Spoken answers are transcribed locally with a lightweight Whisper model and a tiny-model fallback for low-memory machines.',
  },
  {
    icon: 'book',
    title: 'NLP content scoring',
    body: 'TF-IDF relevance, concept coverage, completeness, clarity, grammar and fluency are combined into one content score.',
  },
  {
    icon: 'eye',
    title: 'Non-verbal delivery analysis',
    body: 'Face presence, camera-directed gaze and movement are measured from sampled frames — never claims about how you "feel".',
  },
  {
    icon: 'trend',
    title: 'Adaptive difficulty',
    body: 'Strong answers unlock harder questions, weaker answers pull the next question back to fundamentals.',
  },
  {
    icon: 'file',
    title: 'Resume personalisation',
    body: 'Upload a PDF or DOCX and detected technologies become tailored questions inside the same interview.',
  },
];

const PIPELINE = [
  'Register / Login',
  'Configure interview',
  'AI speaks the question',
  'Camera + mic answer',
  'Whisper transcript',
  'NLP + vision analysis',
  'Hidden scoring',
  'Final dashboard',
];

export default function Landing() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="pill rise">
              <span className="pill-tag">AI</span>
              Mock interview &amp; performance analyzer
            </span>

            <h1 className="display-1 rise rise-1">
              Rehearse the interview.
              <br />
              Measure what{" "}
              <span className="grad-text">actually</span> happened.
            </h1>

            <p className="lead rise rise-2" style={{ maxWidth: 560 }}>
              InterviewSense runs a full spoken mock interview on your laptop, then analyses the
              recording with speech recognition, natural-language evaluation and non-verbal vision —
              so every score is backed by something measurable.
            </p>

            <div className="btn-row rise rise-3">
              <Link to="/register" className="btn btn--primary btn--lg">
                Start practising free
                <Icon name="arrow" size={17} />
              </Link>
              <Link to="/login" className="btn btn--outline btn--lg">
                Sign in to your account
              </Link>
            </div>

            <div className="row row--wrap rise rise-4" style={{ gap: 18 }}>
              <span className="small dim row" style={{ gap: 7 }}>
                <Icon name="check" size={15} /> Runs fully on CPU
              </span>
              <span className="small dim row" style={{ gap: 7 }}>
                <Icon name="check" size={15} /> Temporary media deleted after analysis
              </span>
              <span className="small dim row" style={{ gap: 7 }}>
                <Icon name="check" size={15} /> Feedback only after the interview
              </span>
            </div>
          </div>

          <div className="hero-visual rise rise-3">
            <div className="showcase">
              <div className="showcase-top">
                <span className="showcase-dot" style={{ background: '#dc2626' }} />
                <span className="showcase-dot" style={{ background: '#b45309' }} />
                <span className="showcase-dot" style={{ background: '#0f8a5f' }} />
                <span className="tiny dim" style={{ marginLeft: 8 }}>
                  interviewsense — live session
                </span>
              </div>

              <div className="showcase-screen">
                <div className="row row--between">
                  <span className="badge badge--info">
                    <span className="dot" /> Question 4 / 10
                  </span>
                  <span className="badge badge--warn">
                    <Icon name="clock" size={13} /> 01:30
                  </span>
                </div>

                <p style={{ fontSize: '.95rem', fontWeight: 600, lineHeight: 1.5 }}>
                  “How does a TF-IDF vectoriser decide which words matter in an answer?”
                </p>

                <div className="live-bars" aria-hidden="true">
                  {[0.2, 0.5, 0.9, 0.4, 0.75, 0.3, 0.6, 1, 0.45, 0.8, 0.25, 0.55].map((h, i) => (
                    <span key={i} style={{ height: '100%', animationDelay: `${i * 0.09}s`, transformOrigin: 'bottom' }} />
                  ))}
                </div>

                <div className="grid grid-3" style={{ gap: 10 }}>
                  {[
                    { k: 'Content', v: '82', tone: 'success' },
                    { k: 'Delivery', v: '74', tone: 'brand' },
                    { k: 'Overall', v: '79', tone: 'violet' },
                  ].map((s) => (
                    <div
                      key={s.k}
                      style={{
                        padding: '12px 10px',
                        borderRadius: 12,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        textAlign: 'center',
                      }}
                    >
                      <div className="tiny dim" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        {s.k}
                      </div>
                      <div
                        className="strong"
                        style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', letterSpacing: '-.03em' }}
                      >
                        {s.v}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="tiny dim row" style={{ gap: 7 }}>
                  <Icon name="lock" size={13} /> Scores stay hidden until the interview is complete
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="stat-strip rise rise-5">
            {[
              { v: '50+', k: 'Seeded questions across 5 tracks' },
              { v: '6', k: 'NLP dimensions per answer' },
              { v: '4', k: 'Vision signals for delivery' },
              { v: '100%', k: 'Self-hosted & CPU friendly' },
            ].map((s) => (
              <div key={s.k}>
                <div className="display-2 grad-text" style={{ fontSize: '1.9rem' }}>
                  {s.v}
                </div>
                <div className="small dim" style={{ marginTop: 6 }}>
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page">
        <div className="container stack stack--lg">
          <div className="rise">
            <div className="eyebrow" style={{ marginBottom: 12 }}>
              What it does
            </div>
            <h2 className="display-2" style={{ maxWidth: 620 }}>
              An end-to-end pipeline, not a chat window.
            </h2>
            <p className="lead" style={{ marginTop: 12, maxWidth: 640 }}>
              Every answer passes through the same measurable stages, so the report at the end can
              always explain itself.
            </p>
          </div>

          <div className="grid grid-3 grid--lg">
            {FEATURES.map((f, i) => (
              <article key={f.title} className={`feature rise rise-${(i % 6) + 1}`}>
                <div className="feature-icon">
                  <Icon name={f.icon} size={21} />
                </div>
                <h3 className="h3">{f.title}</h3>
                <p className="muted small" style={{ marginTop: 9 }}>
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="card card--pad-lg card--accent rise">
            <div className="row row--between row--wrap" style={{ gap: 20, marginBottom: 24 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  The flow
                </div>
                <h2 className="display-2" style={{ fontSize: '1.75rem' }}>
                  Eight stages from login to report
                </h2>
              </div>
              <span className="badge badge--violet">
                <Icon name="layers" size={13} /> Full session lifecycle
              </span>
            </div>

            <div className="pipeline">
              {PIPELINE.map((step, i) => (
                <span key={step} className="row" style={{ gap: 10 }}>
                  <span className="pipe-step">
                    <b className="mono">{String(i + 1).padStart(2, '0')}</b>
                    {step}
                  </span>
                  {i < PIPELINE.length - 1 && <span className="pipe-arrow">→</span>}
                </span>
              ))}
            </div>

            <div className="alert alert--warn" style={{ marginTop: 26 }}>
              <span className="alert-icon">
                <Icon name="lock" size={16} />
              </span>
              <div>
                <strong>No scores during the interview.</strong> The candidate stays in an
                uninterrupted interview flow and sees the complete performance dashboard — content,
                delivery, per-question breakdown and recommendations — only after the final answer.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page" style={{ paddingTop: 0 }}>
        <div className="container">
          <div
            className="card card--pad-lg center rise"
            style={{
              background:
                'radial-gradient(700px 260px at 50% 0%, rgba(30,58,95,.08), transparent 70%), #ffffff',
            }}
          >
            <h2 className="display-2" style={{ maxWidth: 640, margin: '0 auto' }}>
              Ready to walk into your next interview prepared?
            </h2>
            <p className="lead" style={{ marginTop: 14, maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
              Create an account, pick a track and complete a ten-question mock interview in the next
              twenty minutes.
            </p>
            <div className="btn-row" style={{ justifyContent: 'center', marginTop: 26 }}>
              <Link to="/register" className="btn btn--primary btn--lg">
                Create your account
                <Icon name="arrow" size={17} />
              </Link>
              <Link to="/login" className="btn btn--outline btn--lg">
                I already have one
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="container foot">
        <span>InterviewSense — AI-based mock interview &amp; performance analyzer.</span>
        <span className="row" style={{ gap: 16 }}>
          <span>FastAPI · React · MongoDB · Whisper · OpenCV</span>
          <Link to="/login">Sign in</Link>
        </span>
      </footer>
    </div>
  );
}
