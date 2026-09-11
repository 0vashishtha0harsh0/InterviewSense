import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Icon, LogoMark } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordOk = form.password.length >= 6;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.msg || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="pill-tag">Start</span>
            Free practice account
          </span>
          <h2 className="display-2">
            Your first mock interview is <span className="grad-text">ten questions</span> away.
          </h2>
          <p className="lead" style={{ fontSize: '.94rem' }}>
            Configure the track, choose a difficulty, optionally attach your resume, then answer on
            camera. The full analysis is revealed at the end.
          </p>
          <ul className="auth-list">
            {[
              'No setup, no installs — runs in the browser',
              'Resume-aware personalised questions',
              'Score history and progress trends over time',
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
          The first registered account on a fresh deployment becomes the administrator.
        </p>
      </aside>

      <div className="auth-main">
        <div className="auth-card rise">
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            Get started
          </div>
          <h1 className="h1" style={{ fontSize: '1.85rem' }}>
            Create your account
          </h1>
          <p className="muted small" style={{ marginTop: 10, marginBottom: 26 }}>
            It takes less than a minute to set up your candidate profile.
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
              <label className="label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                className="input"
                required
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
              />
            </div>

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
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
              />
              <span className="hint row" style={{ gap: 7 }}>
                <Icon
                  name={passwordOk ? 'check' : 'lock'}
                  size={13}
                  style={{ color: passwordOk ? 'var(--emerald)' : undefined }}
                />
                {passwordOk ? 'Password length looks good' : 'Minimum 6 characters'}
              </span>
            </div>

            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner spinner--sm" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <Icon name="arrow" size={17} />
                </>
              )}
            </button>
          </form>

          <p className="hint" style={{ marginTop: 16 }}>
            By creating an account you agree to keep your webcam and microphone permissions enabled
            during an interview so non-verbal delivery can be measured.
          </p>

          <p className="muted small center" style={{ marginTop: 22 }}>
            Already registered? <Link to="/login">Sign in</Link>
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
