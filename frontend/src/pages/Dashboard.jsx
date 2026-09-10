import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';

export default function Dashboard() {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState({ interviews: 0, avg: '-', best: '-', latest: '-', avgContent: '-', avgDelivery: '-' });
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const r = await api.get('/api/interviews');
      const list = r.data || [];
      setHistory(list);
      if (list.length) {
        const scores = list.filter(x => x.overall_score != null).map(x => x.overall_score);
        const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : '-';
        const best = scores.length ? Math.max(...scores) : '-';
        const latest = scores.length ? scores[scores.length-1] : '-';
        if (scores.length===0) {
          setStats({ interviews: list.length, avg, best, latest, avgContent:'-', avgDelivery:'-' });
        } else {
          const details = await Promise.all(list.slice(0,5).map(h=> api.get(`/api/interviews/${h._id}`).then(r=>r.data).catch(()=>null)));
          const cs = details.flatMap(d=> d?.answers?.map(a=>a.content_score).filter(x=>x!=null) || []);
          const ds = details.flatMap(d=> d?.answers?.map(a=>a.delivery_score).filter(x=>x!=null) || []);
          const avgC = cs.length ? (cs.reduce((a,b)=>a+b,0)/cs.length).toFixed(1) : '-';
          const avgD = ds.length ? (ds.reduce((a,b)=>a+b,0)/ds.length).toFixed(1) : '-';
          setStats({ interviews: list.length, avg, best, latest, avgContent: avgC, avgDelivery: avgD });
        }
      } else {
        setStats({ interviews: 0, avg: '-', best: '-', latest: '-', avgContent:'-', avgDelivery:'-' });
      }
    } catch {}
  };

  useEffect(() => {
    api.get('/api/health').then(r => setHealth(r.data)).catch(() => setHealth({ status: 'error' }));
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

  const cards = [
    { label: 'Interviews', value: stats.interviews },
    { label: 'Average Score', value: stats.avg },
    { label: 'Best Score', value: stats.best },
    { label: 'Latest Score', value: stats.latest },
    { label: 'Avg Content', value: stats.avgContent },
    { label: 'Avg Delivery', value: stats.avgDelivery },
  ];

  // Trend data for chart
  const trendScores = history.slice().reverse().filter(h=>h.overall_score!=null).map(h=>h.overall_score);
  const hasTrend = trendScores.length >= 2;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Candidate Dashboard</h1>
        <Link to="/interview/setup" style={{ padding: '10px 18px', background: '#4f46e5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>+ New Interview</Link>
      </div>

      {health && (
        <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: health.status === 'ok' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${health.status === 'ok' ? '#a7f3d0' : '#fecaca'}`, fontSize: 13 }}>
          <strong>API:</strong> {health.status} | DB: {health.database} | Whisper: {health.whisper_model} | Questions auto-seeded 50 | <Link to="/admin/questions" style={{ color: '#7c3aed' }}>Admin</Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>{c.value}</div>
          </div>
        ))}
      </div>

      {hasTrend && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Performance Trend</h3>
          <div style={{ display: 'flex', alignItems: 'end', gap: 4, height: 80 }}>
            {trendScores.map((s,i)=>(
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: s>=70?'#4f46e5':s>=60?'#f59e0b':'#ef4444', height: `${Math.max(8, s)}%`, borderRadius: '4px 4px 0 0', minHeight: 8 }} title={`${s}`}></div>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{i+1}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>Session 1 → {trendScores[trendScores.length-1]} (latest)</div>
          <svg width="100%" height="40" viewBox="0 0 100 40" style={{ marginTop: 8 }}>
            <polyline fill="none" stroke="#4f46e5" strokeWidth="2" points={trendScores.map((s,i)=>`${(i/(trendScores.length-1))*100},${40 - (s/100)*30 -5}`).join(' ')} />
            {trendScores.map((s,i)=> <circle key={i} cx={`${(i/(trendScores.length-1))*100}%`} cy={40 - (s/100)*30 -5} r="2" fill="#4f46e5" />)}
          </svg>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontWeight: 600 }}>Interview History</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{history.length} sessions</span>
            {history.length > 0 && <button onClick={handleDeleteAll} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>Delete All History</button>}
          </div>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: 24, background: '#f9fafb', borderRadius: 8, textAlign: 'center', color: '#9ca3af' }}>No interviews yet — click New Interview to start</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb', textAlign: 'left' }}><th style={{ padding: '8px 10px' }}>Date</th><th style={{ padding: '8px 10px' }}>Type</th><th style={{ padding: '8px 10px' }}>Domain</th><th style={{ padding: '8px 10px' }}>Score</th><th style={{ padding: '8px 10px' }}>Status</th><th style={{ padding: '8px 10px' }}>View</th><th style={{ padding: '8px 10px', textAlign: 'center' }}>Delete</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 10px' }}>{new Date(h.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '8px 10px' }}>{h.interview_type}</td>
                    <td style={{ padding: '8px 10px' }}>{h.domain}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{h.overall_score ?? '—'}</td>
                    <td style={{ padding: '8px 10px' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: h.status==='completed'?'#dcfce7':'#fef3c7', color: h.status==='completed'?'#166534':'#92400e' }}>{h.status}</span></td>
                    <td style={{ padding: '8px 10px' }}><Link to={h.status==='completed' ? `/results/${h._id}` : `/interview/${h._id}`} style={{ display: 'inline-block', padding: '4px 10px', background: '#4f46e5', color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 12 }}>{h.status==='completed' ? 'View' : 'Continue'}</Link></td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}><button onClick={()=>handleDelete(h._id)} title="Delete this interview" style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Delete</button></td>
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
