import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api.js';

function getCategory(score) {
  if (score==null || score==='--') return '';
  if (score>=90) return 'Excellent';
  if (score>=80) return 'Very Good';
  if (score>=70) return 'Good';
  if (score>=60) return 'Needs Improvement';
  return 'Needs Significant Improvement';
}

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
  const overall = session.overall_score ?? (answers.length ? (answers.reduce((a,b)=>a+(b.overall_score||0),0)/answers.length).toFixed(1) : '--');
  const contentAvg = answers.length ? (answers.filter(a=>a.content_score!=null).reduce((a,b)=>a+b.content_score,0)/(answers.filter(a=>a.content_score!=null).length||1)).toFixed(1) : '--';
  const deliveryAvg = answers.length ? (answers.filter(a=>a.delivery_score!=null).reduce((a,b)=>a+b.delivery_score,0)/(answers.filter(a=>a.delivery_score!=null).length||1)).toFixed(1) : '--';
  // Aggregate feedback
  const allStrengths = answers.flatMap(a=> a.feedback?.strengths || []);
  const allImprovements = answers.flatMap(a=> a.feedback?.improvements || []);
  const allRecs = answers.flatMap(a=> a.feedback?.recommendations || []);
  const strengthCounts = allStrengths.reduce((acc,s)=>{acc[s]=(acc[s]||0)+1; return acc;},{});
  const improveCounts = allImprovements.reduce((acc,s)=>{acc[s]=(acc[s]||0)+1; return acc;},{});
  const topStrength = Object.entries(strengthCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || (overall!=='--' && overall>=70 ? 'Good relevance' : 'Completed');
  const topImprove = Object.entries(improveCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Maintain consistency';
  const recommendations = [...new Set(allRecs)].slice(0,5);
  if (recommendations.length===0) {
    if (overall!=='--' && overall<60) recommendations.push('Practice answering aloud with structure and fewer fillers.');
    else recommendations.push('Continue mock interviews to maintain performance.');
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Final Performance Dashboard</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Interview {id.slice(0,8)} • {session.interview_type} ({session.domain}) • {session.role} • {session.status} {session.completed_at && `• ${new Date(session.completed_at).toLocaleString()}`}</p>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          {k:'Overall',v:overall, cat:getCategory(overall)},
          {k:'Content',v:isNaN(contentAvg)?'--':contentAvg, cat:getCategory(contentAvg)},
          {k:'Delivery',v:isNaN(deliveryAvg)?'--':deliveryAvg, cat:getCategory(deliveryAvg)}
        ].map(c=>(
          <div key={c.k} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.k} Score</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: c.k==='Overall'?'#4f46e5':c.k==='Content'?'#059669':'#7c3aed' }}>{c.v}/100</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{c.cat}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#065f46', fontWeight: 700, textTransform: 'uppercase' }}>Strongest Area</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#065f46', marginTop: 4 }}>{topStrength}</div>
        </div>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, textTransform: 'uppercase' }}>Needs Improvement</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#991b1b', marginTop: 4 }}>{topImprove}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontWeight: 600, fontSize: 14 }}>Recommendations</h3>
        <ol style={{ marginTop: 8, paddingLeft: 18, fontSize: 13, color: '#374151' }}>
          {recommendations.map((r,i)=><li key={i} style={{ marginBottom: 6 }}>{r}</li>)}
        </ol>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>Feedback based on actual NLP (relevance, concept, fluency) and CV (face, eye, movement) scores per §44. No psychological claims.</p>
      </div>

      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontWeight: 600, fontSize: 14 }}>Question-wise Breakdown</h3>
        <p style={{ fontSize: 11, color: '#9ca3af' }}>Scores revealed only after completion per §1A — hidden during interview.</p>
        <div style={{ marginTop: 12 }}>
          {answers.length===0 ? <p style={{ color: '#9ca3af' }}>No answers.</p> :
            answers.map((a,i)=>{
              const q = session.questions?.[i];
              return (
                <div key={a._id} style={{ padding: 12, borderTop: i===0?'none':'1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Q{i+1}: {q?.question_text?.slice(0,90) ?? a.question_id}</div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                        <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 4 }}>{q?.difficulty}</span>
                        <span style={{ marginLeft: 8 }}>Transcript: {a.transcript ? a.transcript.slice(0,100)+(a.transcript.length>100?'...':'') : (a.whisper_error || 'No transcript (audio silent or not provided)')}</span>
                      </div>
                      {a.nlp_metrics && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>NLP: relevance {a.nlp_metrics.relevance} | coverage {a.nlp_metrics.concept_coverage} | completeness {a.nlp_metrics.completeness} | fluency {a.nlp_metrics.fluency} {a.nlp_metrics.missing_concepts?.length ? `| missing: ${a.nlp_metrics.missing_concepts.slice(0,2).join(', ')}` : ''}</div>}
                      {a.cv_metrics && !a.cv_metrics.error && <div style={{ fontSize: 11, color: '#6b7280' }}>CV: face {a.cv_metrics.face_presence}% | eye {a.cv_metrics.eye_contact}% | movement {a.cv_metrics.movement_indicator} | blink {a.cv_metrics.blink_rate}/min</div>}
                      {a.cv_metrics?.error && <div style={{ fontSize: 11, color: '#f59e0b' }}>Video: {a.cv_metrics.error}</div>}
                      {a.feedback && <div style={{ fontSize: 11, color: '#374151', marginTop: 4 }}><strong>Strengths:</strong> {a.feedback.strengths.join(', ')} | <strong>Improve:</strong> {a.feedback.improvements.join(', ')}</div>}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 90 }}>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Content</div><div style={{ fontWeight: 700, color: '#059669' }}>{a.content_score ?? '--'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Delivery</div><div style={{ fontWeight: 700, color: '#7c3aed' }}>{a.delivery_score ?? '--'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Overall</div><div style={{ fontWeight: 800, color: '#4f46e5' }}>{a.overall_score ?? '--'}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{a.is_mock ? 'mock' : 'real'}</div>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
        <Link to="/dashboard" style={{ display: 'inline-block', marginTop: 12, color: '#4f46e5', fontSize: 13 }}>← Back to Dashboard</Link>
      </div>
    </div>
  );
}
