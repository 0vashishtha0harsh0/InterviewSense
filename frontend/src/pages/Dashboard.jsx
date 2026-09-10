import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState({ interviews: 0, avg: '-', best: '-', latest: '-' });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/api/health').then(r => setHealth(r.data)).catch(() => setHealth({ status: 'error' }));
    api.get('/api/interviews').then(r => {
      const list = r.data || [];
      setHistory(list);
      if (list.length) {
        const scores = list.filter(x => x.overall_score != null).map(x => x.overall_score);
        const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '-';
        const best = scores.length ? Math.max(...scores) : '-';
        const latest = scores.length ? scores[scores.length-1] : '-';
        setStats({ interviews: list.length, avg, best, latest });
      }
    }).catch(() => {});
  }, []);

  const cards = [
    { label: 'Interviews', value: stats.interviews },
    { label: 'Average Score', value: stats.avg },
    { label: 'Best Score', value: stats.best },
    { label: 'Latest Score', value: stats.latest },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Candidate Dashboard</h1>
        <Link to="/interview/setup" style={{ padding: '10px 18px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>+ New Interview</Link>
      </div>

      {health && (
        <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: health.status === 'ok' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${health.status === 'ok' ? '#a7f3d0' : '#fecaca'}`, fontSize: 13 }}>
          <strong>API:</strong> {health.status} | DB: {health.database} | Whisper: {health.whisper_model} | DB: {health.db_name} | Questions auto-seeded 50
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#111827' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontWeight: 600 }}>Interview History</h2>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{history.length} sessions</span>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: 24, background: '#f9fafb', borderRadius: 8, textAlign: 'center', color: '#9ca3af' }}>No interviews yet — click New Interview to start</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb', textAlign: 'left' }}><th style={{ padding: '8px 10px' }}>Date</th><th style={{ padding: '8px 10px' }}>Type</th><th style={{ padding: '8px 10px' }}>Domain</th><th style={{ padding: '8px 10px' }}>Score</th><th style={{ padding: '8px 10px' }}>Status</th><th style={{ padding: '8px 10px' }}>Action</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 10px' }}>{new Date(h.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 10px' }}>{h.interview_type}</td>
                    <td style={{ padding: '8px 10px' }}>{h.domain}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{h.overall_score ?? '—'}</td>
                    <td style={{ padding: '8px 10px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: h.status==='completed'?'#dcfce7':'#fef3c7', color: h.status==='completed'?'#166534':'#92400e' }}>{h.status}</span></td>
                    <td style={{ padding: '8px 10px' }}><Link to={h.status==='completed' ? `/results/${h._id}` : `/interview/${h._id}`} style={{ color: '#4f46e5' }}>{h.status==='completed' ? 'View Result' : 'Continue'}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
