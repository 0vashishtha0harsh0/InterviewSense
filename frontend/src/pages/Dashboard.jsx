import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Badge,
  EmptyState,
  Icon,
  Loader,
  PageHeader,
  Sparkline,
  StatCard,
  TrendChart,
  statusTone,
} from '../components/ui.jsx';

const EMPTY_STATS = {
  interviews: 0,
  avg: '-',
  best: '-',
  latest: '-',
  avgContent: '-',
  avgDelivery: '-',
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const r = await api.get('/api/interviews');
      const list = r.data || [];
      setHistory(list);
      if (list.length) {
        const scores = list.filter((x) => x.overall_score != null).map((x) => x.overall_score);
        const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
        const best = scores.length ? Math.max(...scores) : '-';
        const latest = scores.length ? scores[scores.length - 1] : '-';
        if (scores.length === 0) {
          setStats({ interviews: list.length, avg, best, latest, avgContent: '-', avgDelivery: '-' });
        } else {
          const details = await Promise.all(
            list.slice(0, 5).map((h) => api.get(`/api/interviews/${h._id}`).then((res) => res.data).catch(() => null)),
          );
          const cs = details.flatMap((d) => d?.answers?.map((a) => a.content_score).filter((x) => x != null) || []);
          const ds = details.flatMap((d) => d?.answers?.map((a) => a.delivery_score).filter((x) => x != null) || []);
          const avgC = cs.length ? (cs.reduce((a, b) => a + b, 0) / cs.length).toFixed(1) : '-';
          const avgD = ds.length ? (ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(1) : '-';
          setStats({ interviews: list.length, avg, best, latest, avgContent: avgC, avgDelivery: avgD });
        }
      } else {
        setStats(EMPTY_STATS);
      }
    } catch {
      /* keep last known state */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .get('/api/health')
      .then((r) => setHealth(r.data))
      .catch(() => setHealth({ status: 'error' }));
    fetchHistory();
  }, []);

  const handleDelete = async (sid) => {
    if (!confirm('Delete this interview history? This will also delete its answers. This cannot be undone.')) return;
    try {
      await api.delete(`/api/interviews/${sid}`);
      await fetchHistory();
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete failed');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Delete ALL ${history.length} interview histories? This cannot be undone.`)) return;
    if (!confirm('Are you absolutely sure? Confirm again to delete all.')) return;
    try {
      await api.delete('/api/interviews');
      await fetchHistory();
    } catch (err) {
      alert(err.response?.data?.detail || 'Delete all failed');
    }
  };

  const trendScores = history
    .slice()
    .reverse()
    .filter((h) => h.overall_score != null)
    .map((h) => h.overall_score);

  const inProgress = history.find((h) => h.status !== 'completed');
  const completed = history.filter((h) => h.status === 'completed').length;
  const first = user?.name?.split(' ')[0] || 'there';

  if (loading && history.length === 0 && !health) {
    return (
      <div className="page container">
        <Loader label="Loading your dashboard…" />
      </div>
    );
  }

  return (
    <div className="page container">
      <PageHeader
        eyebrow={`${greeting()}, ${first}`}
        title="Candidate Dashboard"
        subtitle="Track every mock interview, review your scores and keep the trend pointing up."
        icon={<Icon name="activity" size={14} />}
        actions={
          <>
            {inProgress && (
              <Link to={inProgress.status === 'completed' ? `/results/${inProgress._id}` : `/interview/${inProgress._id}`} className="btn btn--outline">
                <Icon name="play" size={15} />
                Resume session
              </Link>
            )}
            <Link to="/interview/setup" className="btn btn--primary">
              <Icon name="plus" size={16} />
              New Interview
            </Link>
          </>
        }
      />

      {health && (
        <div className="card card--quiet health-strip rise rise-1" style={{ marginBottom: 20 }}>
          <span className="health-item">
            <span className={`health-dot${health.status === 'ok' ? '' : ' health-dot--bad'}`} />
            <strong style={{ color: 'var(--text)' }}>API</strong>
            <span>{health.status}</span>
          </span>
          <span className="health-item">
            <Icon name="layers" size={14} />
            Database: <strong style={{ color: 'var(--text)' }}>{health.database}</strong>
          </span>
          <span className="health-item">
            <Icon name="mic" size={14} />
            Whisper: <strong style={{ color: 'var(--text)' }}>{health.whisper_model}</strong>
          </span>
          <span className="health-item">
            <Icon name="book" size={14} />
            50 questions auto-seeded
          </span>
          <Link to="/admin/questions" className="row" style={{ gap: 6, marginLeft: 'auto' }}>
            Question bank <Icon name="arrow" size={14} />
          </Link>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <StatCard
          label="Interviews"
          value={stats.interviews}
          hint={`${completed} completed session${completed === 1 ? '' : 's'}`}
          icon={<Icon name="dashboard" size={16} />}
          tone="brand"
          delay={1}
        />
        <StatCard
          label="Average Score"
          value={stats.avg}
          suffix={stats.avg !== '-' ? '/100' : undefined}
          hint="Across all scored sessions"
          icon={<Icon name="target" size={16} />}
          tone="violet"
          delay={2}
        />
        <StatCard
          label="Best Score"
          value={stats.best}
          suffix={stats.best !== '-' ? '/100' : undefined}
          hint="Personal record"
          icon={<Icon name="award" size={16} />}
          tone="success"
          delay={3}
        />
        <StatCard
          label="Latest Score"
          value={stats.latest}
          suffix={stats.latest !== '-' ? '/100' : undefined}
          hint="Most recent session"
          icon={<Icon name="clock" size={16} />}
          tone="cyan"
          delay={4}
        />
        <StatCard
          label="Avg Content"
          value={stats.avgContent}
          suffix={stats.avgContent !== '-' ? '/100' : undefined}
          hint="NLP answer quality"
          icon={<Icon name="book" size={16} />}
          tone="success"
          delay={5}
        />
        <StatCard
          label="Avg Delivery"
          value={stats.avgDelivery}
          suffix={stats.avgDelivery !== '-' ? '/100' : undefined}
          hint="Non-verbal behaviour"
          icon={<Icon name="eye" size={16} />}
          tone="violet"
          delay={6}
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20, alignItems: 'stretch' }}>
        <div className="card card--pad rise rise-2">
          <div className="row row--between" style={{ marginBottom: 18 }}>
            <div>
              <div className="card-title">Performance Trend</div>
              <div className="card-sub">Overall score per session, oldest to newest</div>
            </div>
            <Badge tone={trendScores.length ? 'info' : 'neutral'}>
              {trendScores.length} scored
            </Badge>
          </div>
          {trendScores.length >= 2 ? (
            <TrendChart scores={trendScores} />
          ) : (
            <div className="empty" style={{ padding: '30px 10px' }}>
              <div className="empty-icon">
                <Icon name="trend" size={22} />
              </div>
              <p className="dim small">
                Complete at least two interviews to unlock your progress trend.
              </p>
            </div>
          )}
        </div>

        <div className="card card--pad rise rise-3">
          <div className="card-title" style={{ marginBottom: 6 }}>
            Score breakdown
          </div>
          <div className="card-sub" style={{ marginBottom: 20 }}>
            How content and delivery compare across recent sessions
          </div>

          {[
            { label: 'Average overall', value: stats.avg, icon: 'target', tone: 'brand' },
            { label: 'Content (NLP)', value: stats.avgContent, icon: 'book', tone: 'success' },
            { label: 'Delivery (vision)', value: stats.avgDelivery, icon: 'eye', tone: 'violet' },
          ].map((row) => {
            const num = Number(row.value);
            const valid = row.value !== '-' && !Number.isNaN(num);
            const fill =
              row.tone === 'success' ? 'success' : row.tone === 'violet' ? 'brand' : num >= 70 ? 'success' : num >= 60 ? 'warn' : 'danger';
            return (
              <div key={row.label} style={{ marginBottom: 18 }}>
                <div className="row row--between" style={{ marginBottom: 8 }}>
                  <span className="row small" style={{ gap: 9, color: 'var(--text-2)' }}>
                    <Icon name={row.icon} size={15} />
                    {row.label}
                  </span>
                  <span className="mono strong" style={{ color: 'var(--text)' }}>
                    {valid ? num.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="bar">
                  <div
                    className={`bar-fill bar-fill--${fill}`}
                    style={{ width: `${valid ? Math.max(2, Math.min(100, num)) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="divider" style={{ margin: '4px 0 16px' }} />
          <div className="row row--between">
            <span className="small dim">Recent trajectory</span>
            <Sparkline points={trendScores.slice(-8)} tone="brand" />
          </div>
        </div>
      </div>

      <section className="card card--flush rise rise-3">
        <div className="card-head">
          <div>
            <div className="card-title">Interview History</div>
            <div className="card-sub">
              {history.length} session{history.length === 1 ? '' : 's'} recorded · scores unlock after completion
            </div>
          </div>
          {history.length > 0 && (
            <button type="button" className="btn btn--danger btn--sm" onClick={handleDeleteAll}>
              <Icon name="trash" size={14} />
              Delete all
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyState
            icon="sparkle"
            title="No interviews yet"
            message="Run your first mock interview to start building a performance history and trend chart."
            action={
              <Link to="/interview/setup" className="btn btn--primary">
                <Icon name="plus" size={16} />
                Start your first interview
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Domain</th>
                  <th>Role</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id}>
                    <td className="nowrap">
                      {new Date(h.created_at).toLocaleDateString(undefined, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="cell-strong">{h.interview_type}</td>
                    <td>{h.domain}</td>
                    <td className="dim small">{h.role}</td>
                    <td>
                      <span className="cell-score">{h.overall_score ?? '—'}</span>
                      {h.overall_score != null && <span className="dim tiny">/100</span>}
                    </td>
                    <td>
                      <Badge tone={statusTone(h.status)}>
                        <span className="dot" />
                        {h.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <Link
                          to={h.status === 'completed' ? `/results/${h._id}` : `/interview/${h._id}`}
                          className={`btn btn--sm ${h.status === 'completed' ? 'btn--outline' : 'btn--primary'}`}
                        >
                          {h.status === 'completed' ? 'View result' : 'Continue'}
                          <Icon name="arrow" size={13} />
                        </Link>
                        <button
                          type="button"
                          className="btn btn--danger btn--icon"
                          title="Delete this interview"
                          aria-label="Delete this interview"
                          onClick={() => handleDelete(h._id)}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
