import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Badge, EmptyState, Icon, PageHeader, StatCard } from '../components/ui.jsx';

export default function Admin() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/questions')
      .then((r) => setQuestions(r.data || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
    api
      .get('/api/health')
      .then((r) => setHealth(r.data))
      .catch(() => setHealth(null));
  }, []);

  const byType = questions.reduce((acc, q) => {
    acc[q.interview_type] = (acc[q.interview_type] || 0) + 1;
    return acc;
  }, {});
  const byDifficulty = questions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});
  const byDomain = questions.reduce((acc, q) => {
    acc[q.domain] = (acc[q.domain] || 0) + 1;
    return acc;
  }, {});

  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const domainEntries = Object.entries(byDomain).sort((a, b) => b[1] - a[1]);
  const maxDomain = Math.max(1, ...domainEntries.map(([, n]) => n));

  return (
    <div className="page container">
      <PageHeader
        eyebrow={`Signed in as ${user?.name || 'admin'}`}
        title="Admin control centre"
        subtitle="Curate the question bank that powers every generated interview."
        icon={<Icon name="shield" size={14} />}
        actions={
          <Link to="/admin/questions" className="btn btn--primary">
            <Icon name="edit" size={16} />
            Manage questions
          </Link>
        }
      />

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard
          label="Total questions"
          value={questions.length}
          hint="Available to interview generator"
          icon={<Icon name="book" size={16} />}
          tone="brand"
          delay={1}
        />
        <StatCard
          label="Interview types"
          value={Object.keys(byType).length}
          hint="HR · Technical · Behavioral · Domain"
          icon={<Icon name="layers" size={16} />}
          tone="violet"
          delay={2}
        />
        <StatCard
          label="Domains covered"
          value={Object.keys(byDomain).length}
          hint="Filterable tracks"
          icon={<Icon name="target" size={16} />}
          tone="cyan"
          delay={3}
        />
        <StatCard
          label="Hard questions"
          value={byDifficulty.hard || 0}
          hint={`${byDifficulty.easy || 0} easy · ${byDifficulty.medium || 0} medium`}
          icon={<Icon name="zap" size={16} />}
          tone="warn"
          delay={4}
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <section className="card card--pad rise rise-2">
          <div className="card-title" style={{ marginBottom: 6 }}>
            Question bank health
          </div>
          <div className="card-sub" style={{ marginBottom: 20 }}>
            Spread across interview types
          </div>

          {typeEntries.length === 0 ? (
            <EmptyState
              icon="book"
              title={loading ? 'Loading question bank…' : 'No questions found'}
              message={loading ? undefined : 'Add questions to enable interview generation.'}
            />
          ) : (
            <div className="stack" style={{ gap: 14 }}>
              {typeEntries.map(([type, count]) => (
                <div key={type}>
                  <div className="row row--between" style={{ marginBottom: 8 }}>
                    <span className="row small" style={{ gap: 9 }}>
                      <Icon name="book" size={14} />
                      {type}
                    </span>
                    <span className="mono strong" style={{ color: 'var(--text)' }}>
                      {count}
                    </span>
                  </div>
                  <div className="bar">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max(4, (count / Math.max(1, questions.length)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card card--pad rise rise-3">
          <div className="card-title" style={{ marginBottom: 6 }}>
            Domain coverage
          </div>
          <div className="card-sub" style={{ marginBottom: 20 }}>
            How many questions exist per domain
          </div>

          {domainEntries.length === 0 ? (
            <p className="dim small">No domain data available.</p>
          ) : (
            <div className="stack" style={{ gap: 14 }}>
              {domainEntries.map(([domain, count]) => (
                <div key={domain}>
                  <div className="row row--between" style={{ marginBottom: 8 }}>
                    <span className="small" style={{ color: 'var(--text-2)' }}>
                      {domain}
                    </span>
                    <span className="mono strong" style={{ color: 'var(--text)' }}>
                      {count}
                    </span>
                  </div>
                  <div className="bar">
                    <div className="bar-fill bar-fill--success" style={{ width: `${(count / maxDomain) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-2">
        <section className="card card--pad card--accent rise rise-4">
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <span className="stat-icon">
              <Icon name="edit" size={16} />
            </span>
            <div>
              <div className="card-title" style={{ fontSize: '.96rem' }}>
                Question bank management
              </div>
              <div className="card-sub">Create, edit, filter and delete questions</div>
            </div>
          </div>
          <p className="small muted" style={{ marginBottom: 18 }}>
            Each question stores expected concepts and keywords, which the NLP engine uses to measure
            concept coverage when scoring candidate answers.
          </p>
          <Link to="/admin/questions" className="btn btn--primary">
            Open question bank
            <Icon name="arrow" size={16} />
          </Link>
        </section>

        <section className="card card--pad rise rise-4">
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <span className="stat-icon">
              <Icon name="activity" size={16} />
            </span>
            <div>
              <div className="card-title" style={{ fontSize: '.96rem' }}>
                Platform status
              </div>
              <div className="card-sub">Runtime services behind the interviews</div>
            </div>
          </div>

          <div className="stack stack--sm">
            {[
              { k: 'API', v: health?.status || 'unknown', tone: health?.status === 'ok' ? 'success' : 'danger' },
              { k: 'Database', v: health?.database || 'unknown', tone: health?.database === 'connected' ? 'success' : 'danger' },
              { k: 'Whisper model', v: health?.whisper_model || 'unknown', tone: 'info' },
              { k: 'Adaptive difficulty', v: 'enabled', tone: 'violet' },
            ].map((r) => (
              <div key={r.k} className="row row--between">
                <span className="small dim">{r.k}</span>
                <Badge tone={r.tone}>{r.v}</Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
