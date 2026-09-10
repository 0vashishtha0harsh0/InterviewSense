import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ interview_type: 'Technical', domain: 'AI/ML', role: 'ML Engineer', difficulty: 'medium', question_count: 10 });
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Interview Setup</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <p style={{ color: '#6b7280', marginBottom: 16, fontSize: 14 }}>M1 placeholder — M3 will wire POST /api/interviews. Configurable ~10 questions.</p>
        {[
          { key: 'interview_type', label: 'Interview Type', options: ['HR','Technical','Behavioral','Domain-specific'] },
          { key: 'domain', label: 'Domain', options: ['AI/ML','Computer Science','Software Development','Data Science','Web Development'] },
          { key: 'role', label: 'Role', options: ['ML Engineer','Software Developer','Data Scientist','Web Developer'] },
          { key: 'difficulty', label: 'Difficulty', options: ['easy','medium','hard'] },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>{f.label}</label>
            <select value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }}>
              {f.options.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Number of Questions</label>
          <input type="number" min={5} max={15} value={form.question_count} onChange={e=>setForm({...form, question_count: parseInt(e.target.value)||10})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <button onClick={()=>alert('M3 will create interview via POST /api/interviews')} style={{ width: '100%', padding: 12, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Start Interview (M3)</button>
        <button onClick={()=>navigate('/dashboard')} style={{ width: '100%', marginTop: 10, padding: 10, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>Back to Dashboard</button>
      </div>
    </div>
  );
}
