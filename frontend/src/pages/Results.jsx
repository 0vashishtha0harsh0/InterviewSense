import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Results() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get(`/api/interviews/${id}`).then(r=>setSession(r.data)).catch(e=>setError(e.response?.data?.detail||'Failed to load'));
  }, [id]);
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>{error}</div>;
  if (!session) return <div style={{ padding: 40, textAlign: 'center' }}>Loading final dashboard...</div>;
  const answers = session.answers || [];
  const overall = session.overall_score ?? (answers.length ? Math.round(answers.reduce((a,b)=>a+(b.overall_score||0),0)/answers.length) : '--');
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Final Performance Dashboard</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Interview {id.slice(0,8)} • {session.interview_type} ({session.domain}) • {session.status}</p>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[{k:'Overall',v:overall},{k:'Content',v:session.content_score ?? '--'},{k:'Delivery',v:session.delivery_score ?? '--'}].map(c=>(
          <div key={c.k} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{c.k} Score</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#4f46e5' }}>{c.v}/100</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontWeight: 600 }}>Question-wise Breakdown — M3 placeholder (M7 will show real NLP/CV scores)</h3>
        <div style={{ marginTop: 12 }}>
          {answers.length===0 ? <p style={{ color: '#9ca3af' }}>No answers yet. M3 mock scores stored hidden; M4-M7 will add transcript + NLP/CV.</p> :
            answers.map((a,i)=>(
              <div key={a._id} style={{ padding: '10px 12px', borderTop: i===0?'none':'1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Q{i+1} — {session.questions?.[i]?.question_text?.slice(0,60) ?? a.question_id}...</span>
                <span style={{ fontWeight: 600 }}>Mock Score: {a.overall_score ?? '--'}</span>
              </div>
            ))
          }
        </div>
        <p style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>Hidden scoring: During interview you saw only “Analyzing...” — scores revealed only here after completion (per spec §1A).</p>
        <Link to="/dashboard" style={{ display: 'inline-block', marginTop: 12, color: '#4f46e5' }}>← Back to Dashboard</Link>
      </div>
    </div>
  );
}
