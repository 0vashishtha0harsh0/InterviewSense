import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ interview_type: 'Technical', domain: 'AI/ML', role: 'ML Engineer', difficulty: 'medium', question_count: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useResume, setUseResume] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeStatus, setResumeStatus] = useState('');
  const [resumeKeywords, setResumeKeywords] = useState(null);
  const [timed, setTimed] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(90);

  const handleResumeUpload = async () => {
    if (!resumeFile) { setResumeStatus('Select a PDF or DOCX file first'); return; }
    setResumeStatus('Uploading...');
    try {
      const fd = new FormData();
      fd.append('file', resumeFile);
      const res = await api.post('/api/resume/upload', fd, { headers: { 'Content-Type': undefined }, transformRequest: [(d)=>d] });
      setResumeKeywords(res.data.keywords);
      setResumeStatus(`✓ ${res.data.message} — Preview: ${res.data.preview.slice(0,80)}...`);
    } catch (err) {
      setResumeStatus(err.response?.data?.detail || 'Resume upload failed');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      // If useResume checked but not yet uploaded, try upload first
      if (useResume && resumeFile && !resumeKeywords) {
        await handleResumeUpload();
      }
      const payload = { ...form, use_resume: useResume, timed, time_per_question: timePerQuestion };
      const res = await api.post('/api/interviews', payload);
      const session = res.data;
      navigate(`/interview/${session._id}`);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.msg || 'Failed to create interview. Check filters — insufficient questions?');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Interview Setup</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24 }}>
        <p style={{ color: '#6b7280', marginBottom: 16, fontSize: 13 }}>Configure your mock interview. ~10 questions (5–15 configurable). Questions selected randomly, no duplicates, difficulty respected with fallback.</p>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}
          {[
            { key: 'interview_type', label: 'Interview Type', options: ['HR','Technical','Behavioral','Domain-specific'] },
            { key: 'domain', label: 'Domain', options: ['AI/ML','Computer Science','Software Development','General','Data Science','Web Development'] },
            { key: 'role', label: 'Role', options: ['ML Engineer','Software Developer','Data Scientist','Web Developer','General'] },
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
          <label style={{ display: 'block', fontWeight: 500, marginBottom: 6 }}>Number of Questions (5–15)</label>
          <input type="number" min={5} max={15} value={form.question_count} onChange={e=>setForm({...form, question_count: parseInt(e.target.value)||10})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={useResume} onChange={e=>setUseResume(e.target.checked)} />
            Use resume for personalized questions (PDF/DOCX)
          </label>
          {useResume && (
            <div style={{ marginTop: 10 }}>
              <input type="file" accept=".pdf,.docx" onChange={e=>setResumeFile(e.target.files[0])} style={{ width: '100%', fontSize: 13 }} />
              <button onClick={handleResumeUpload} disabled={!resumeFile} style={{ marginTop: 8, padding: '6px 12px', borderRadius: 6, border: '1px solid #a5b4fc', background: '#eef2ff', cursor: 'pointer', fontSize: 12 }}>Upload Resume</button>
              {resumeStatus && <div style={{ marginTop: 8, fontSize: 12, color: resumeKeywords ? '#065f46' : '#dc2626', background: resumeKeywords ? '#ecfdf5' : '#fef2f2', padding: 8, borderRadius: 6 }}>{resumeStatus}</div>}
              {resumeKeywords && resumeKeywords.technologies?.length >0 && <div style={{ marginTop: 6, fontSize: 11, color: '#6b7280' }}>Detected: {resumeKeywords.technologies.join(', ')}</div>}
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Lightweight keyword extraction (no LLM). If resume contains Python/TensorFlow, you’ll get Qs like “Explain a project you built using Python.” Falls back to normal if no resume.</p>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 500, cursor: 'pointer' }}>
            <input type="checkbox" checked={timed} onChange={e=>setTimed(e.target.checked)} />
            Time-bound per question (auto-record + auto-next)
          </label>
          <p style={{ fontSize: 11, color: '#92400e', marginTop: 4 }}>If ON: recording starts automatically on each question, timer counts down, auto-submits when time ends. Manual Next still available. If OFF: still auto-starts recording directly (no prep pause), but no timer — submit manually.</p>
          {timed && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 6, fontSize: 13 }}>Time per question</label>
              <select value={timePerQuestion} onChange={e=>setTimePerQuestion(parseInt(e.target.value))} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
                <option value={30}>30 seconds</option>
                <option value={60}>60 seconds</option>
                <option value={90}>90 seconds (recommended)</option>
                <option value={120}>120 seconds</option>
                <option value={180}>180 seconds</option>
              </select>
            </div>
          )}
        </div>

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', padding: 12, background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading?'wait':'pointer', opacity: loading?0.7:1 }}>{loading ? 'Creating...' : 'Start Interview →'}</button>
        <button onClick={()=>navigate('/dashboard')} style={{ width: '100%', marginTop: 10, padding: 10, background: '#fff', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' }}>Back to Dashboard</button>
      </div>
    </div>
  );
}
