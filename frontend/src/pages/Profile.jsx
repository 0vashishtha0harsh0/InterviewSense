import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, Icon, PageHeader } from '../components/ui.jsx';

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'IS';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Profile() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="page container container--narrow">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        subtitle="Identity used across your interview sessions and reports."
        icon={<Icon name="user" size={14} />}
        actions={
          <Link to="/dashboard" className="btn btn--outline">
            <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
            Dashboard
          </Link>
        }
      />

      <section className="card card--pad-lg rise rise-1">
        <div className="row row--wrap" style={{ gap: 20 }}>
          <span
            className="avatar"
            style={{ width: 72, height: 72, fontSize: '1.5rem', borderRadius: 22 }}
          >
            {initials(user?.name)}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 className="h1" style={{ fontSize: '1.4rem' }}>
              {user?.name}
            </h2>
            <p className="muted small" style={{ marginTop: 6 }}>
              {user?.email}
            </p>
            <div className="row row--wrap" style={{ gap: 8, marginTop: 14 }}>
              <Badge tone={isAdmin ? 'violet' : 'info'}>
                <Icon name={isAdmin ? 'shield' : 'user'} size={12} />
                {user?.role}
              </Badge>
              <Badge tone="success">
                <Icon name="check" size={12} /> Email verified
              </Badge>
            </div>
          </div>
        </div>

        <div className="divider" style={{ margin: '26px 0' }} />

        <div className="grid grid-2">
          {[
            { k: 'Full name', v: user?.name, icon: 'user' },
            { k: 'Email address', v: user?.email, icon: 'mail' },
            { k: 'Account role', v: user?.role, icon: 'shield' },
            { k: 'Session storage', v: 'MongoDB · JWT auth', icon: 'layers' },
          ].map((r) => (
            <div key={r.k}>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <Icon name={r.icon} size={14} style={{ color: 'var(--text-3)' }} />
                <span className="label" style={{ margin: 0 }}>
                  {r.k}
                </span>
              </div>
              <p className="small truncate" style={{ color: 'var(--text)', textTransform: r.k === 'Account role' ? 'capitalize' : 'none' }}>
                {r.v || '—'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="card card--pad rise rise-2" style={{ marginTop: 20 }}>
        <div className="row" style={{ gap: 10, marginBottom: 14 }}>
          <span className="stat-icon" style={{ color: 'var(--cyan)' }}>
            <Icon name="lock" size={16} />
          </span>
          <div>
            <div className="card-title" style={{ fontSize: '.95rem' }}>
              Privacy &amp; data
            </div>
            <div className="card-sub">How InterviewSense handles your recordings</div>
          </div>
        </div>

        <ul className="auth-list">
          {[
            'Audio and video are processed only after you submit an answer.',
            'Temporary media files are deleted once scoring completes.',
            'Raw recordings are never stored permanently in the workspace.',
            'Only you and administrators can read your interview sessions.',
          ].map((t) => (
            <li key={t} style={{ fontSize: '.84rem' }}>
              <span className="auth-check">
                <Icon name="check" size={11} strokeWidth={3} />
              </span>
              {t}
            </li>
          ))}
        </ul>

        <div className="btn-row" style={{ marginTop: 20 }}>
          <Link to="/interview/setup" className="btn btn--primary">
            <Icon name="plus" size={16} />
            Start a new interview
          </Link>
          {isAdmin && (
            <Link to="/admin/questions" className="btn btn--outline">
              <Icon name="book" size={16} />
              Manage question bank
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
