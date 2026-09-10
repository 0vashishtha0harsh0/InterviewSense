import { useParams } from 'react-router-dom';
export default function Results() {
  const { id } = useParams();
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Final Performance Dashboard — {id || 'M8'}</h1>
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[{k:'Overall',v:'--'},{k:'Content',v:'--'},{k:'Delivery',v:'--'}].map(c=>(
          <div key={c.k} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{c.k} Score</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#4f46e5' }}>{c.v}/100</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <p style={{ color: '#6b7280' }}>M8 will render: question-wise breakdown, strengths/weaknesses, recommendations, performance trend. Hidden until all ~10 questions complete (M7 scoring).</p>
      </div>
    </div>
  );
}
