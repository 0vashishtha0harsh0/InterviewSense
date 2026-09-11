import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Icon, LogoMark } from '../components/ui.jsx';

const DEMO = [
  { label: 'Candidate demo', email: 'candidate@example.com', password: 'candidate123' },
  { label: 'Admin demo', email: 'admin@interviewsense.com', password: 'admin123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      const target = location.state?.from;
      if (target) navigate(target, { replace: true });
      else navigate(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed — check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d) => setForm({ email: d.email, password: d.password });

  return (
    <div className="auth app-bg">
      <aside className="auth-side">
        <Link to="/" className="brand">
          <LogoMark />
          <span>
            Interview<span className="grad-text">Sense</span>
          </span>
        </Link>

        <div className="stack" style={{ gap: 22, maxWidth: 460 }}>
          <span className="pill">
            <span className="pill-tag">AI</span>
            Mock interview &amp; performance analyzer
          </span>
          <h2 className="display-2">
            Walk in rehearsed, not <span className="grad-text">hopeful</span>.
          </h2>
          <ul className="auth-list">
            {[
              'Voice-driven questions with camera and microphone capture',
              'Whisper transcription plus NLP content scoring',
              'Non-verbal delivery analysis from sampled video frames',
              'A complete performance report once the interview ends',
            ].map((t) => (
              <li key={t}>
                <span className="auth-check">
                  <Icon name="check" size={12} strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="tiny dim" style={{ maxWidth: 380 }}>
          Your audio and video are processed for analysis only and temporary media is removed after
          scoring. Nothing is shown to you mid-interview.
        </p>
      </aside>

      <div className="auth-main">
        <div className="auth-card rise">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Welcome back
          </div>
          <h1 className="h1" style={{ fontSize: '1.85rem' }}>
            Sign in to InterviewSense
          </h1>
          <p className="muted small" style={{ marginTop: 10, marginBottom: 26 }}>
            Continue your practice sessions and review past performance reports.
          </p>

          {error && (
            <div style={{ marginBottom: 18 }}>
              <Alert tone="error" icon={<Icon name="close" size={16} />}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate>
            <div className="field">
              <label className="label" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                className="input"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner--sm" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <Icon name="arrow" size={17} />
                </>
              )}
            </button>
          </form>

          <div className="divider-label">demo accounts</div>

          <div className="demo-creds">
            {DEMO.map((d) => (
              <button key={d.email} type="button" className="demo-cred" onClick={() => fillDemo(d)}>
                <span className="row" style={{ gap: 9 }}>
                  <Icon name="user" size={15} />
                  <span style={{ fontWeight: 600, fontSize: '.82rem' }}>{d.label}</span>
                </span>
                <code>{d.email}</code>
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 8 }}>
            Click a demo account to fill the form automatically.
          </p>

          <p className="muted small center" style={{ marginTop: 26 }}>
            No account yet? <Link to="/register">Create one</Link>
          </p>
          <p className="center" style={{ marginTop: 12 }}>
            <Link to="/" className="small dim">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
