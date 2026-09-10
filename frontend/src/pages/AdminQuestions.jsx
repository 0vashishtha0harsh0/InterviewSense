import { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ domain: '', difficulty: '', interview_type: '', search: '' });
  const [form, setForm] = useState({ question_text: '', interview_type: 'Technical', domain: 'AI/ML', role: 'ML Engineer', difficulty: 'medium', expected_concepts: '', keywords: '' });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const fetchQs = async () => {
    const params = {};
    if (filters.domain) params.domain = filters.domain;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.interview_type) params.interview_type = filters.interview_type;
    if (filters.search) params.search = filters.search;
    const res = await api.get('/api/questions', { params });
    setQuestions(res.data);
  };
  useEffect(() => { fetchQs(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        expected_concepts: form.expected_concepts.split(',').map(s=>s.trim()).filter(Boolean),
        keywords: form.keywords.split(',').map(s=>s.trim()).filter(Boolean),
        follow_up_questions: []
      };
      if (editing) {
        await api.put(`/api/questions/${editing}`, payload);
        setEditing(null);
      } else {
        await api.post('/api/questions', payload);
      }
      setForm({ question_text: '', interview_type: 'Technical', domain: 'AI/ML', role: 'ML Engineer', difficulty: 'medium', expected_concepts: '', keywords: '' });
      fetchQs();
    } catch (err) { setError(err.response?.data?.detail || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    await api.delete(`/api/questions/${id}`);
    fetchQs();
  };
  const startEdit = (q) => {
    setEditing(q._id);
    setForm({
      question_text: q.question_text,
      interview_type: q.interview_type,
      domain: q.domain,
      role: q.role,
      difficulty: q.difficulty,
      expected_concepts: (q.expected_concepts||[]).join(', '),
      keywords: (q.keywords||[]).join(', ')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Question Bank Management — {questions.length} questions</h1>

      <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <select value={filters.domain} onChange={e=>setFilters({...filters,domain:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All Domains</option><option>AI/ML</option><option>Computer Science</option><option>Software Development</option><option>General</option>
        </select>
        <select value={filters.difficulty} onChange={e=>setFilters({...filters,difficulty:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All Difficulties</option><option>easy</option><option>medium</option><option>hard</option>
        </select>
        <select value={filters.interview_type} onChange={e=>setFilters({...filters,interview_type:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
          <option value="">All Types</option><option>HR</option><option>Behavioral</option><option>Technical</option><option>Domain-specific</option>
        </select>
        <input placeholder="Search..." value={filters.search} onChange={e=>setFilters({...filters,search:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db', flex: 1, minWidth: 160 }} />
        <button onClick={fetchQs} style={{ padding: '8px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Filter</button>
      </div>

      <form onSubmit={handleCreate} style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>{editing ? 'Edit Question' : 'Add New Question'} {editing && <button type="button" onClick={()=>{setEditing(null); setForm({ question_text: '', interview_type: 'Technical', domain: 'AI/ML', role: 'ML Engineer', difficulty: 'medium', expected_concepts: '', keywords: '' });}} style={{ marginLeft: 8, fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db' }}>Cancel Edit</button>}</h3>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 8, borderRadius: 6, marginBottom: 8, fontSize: 13 }}>{error}</div>}
        <textarea required placeholder="Question text (min 10 chars)" value={form.question_text} onChange={e=>setForm({...form,question_text:e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', minHeight: 60, marginBottom: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <select value={form.interview_type} onChange={e=>setForm({...form,interview_type:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}><option>HR</option><option>Behavioral</option><option>Technical</option><option>Domain-specific</option></select>
          <select value={form.domain} onChange={e=>setForm({...form,domain:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}><option>AI/ML</option><option>Computer Science</option><option>Software Development</option><option>General</option></select>
          <select value={form.difficulty} onChange={e=>setForm({...form,difficulty:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}><option>easy</option><option>medium</option><option>hard</option></select>
          <input placeholder="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{ padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>
        <input placeholder="Expected concepts (comma separated)" value={form.expected_concepts} onChange={e=>setForm({...form,expected_concepts:e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 8 }} />
        <input placeholder="Keywords (comma separated)" value={form.keywords} onChange={e=>setForm({...form,keywords:e.target.value})} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 8 }} />
        <button type="submit" style={{ padding: '8px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>{editing ? 'Update' : 'Add Question'}</button>
      </form>

      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 120px', gap: 0, background: '#f9fafb', padding: '10px 12px', fontWeight: 600, fontSize: 12 }}>
          <span>Question</span><span>Type</span><span>Domain</span><span>Difficulty</span><span>Actions</span>
        </div>
        {questions.map(q=>(
          <div key={q._id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 120px', gap: 8, padding: '10px 12px', borderTop: '1px solid #e5e7eb', fontSize: 13, alignItems: 'center' }}>
            <span title={q.question_text}>{q.question_text.slice(0,80)}{q.question_text.length>80?'...':''}</span>
            <span>{q.interview_type}</span><span>{q.domain}</span><span>{q.difficulty}</span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button onClick={()=>startEdit(q)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', cursor: 'pointer', fontSize: 11 }}>Edit</button>
              <button onClick={()=>handleDelete(q._id)} style={{ padding: '4px 8px', borderRadius: 4, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11 }}>Delete</button>
            </span>
          </div>
        ))}
        {questions.length===0 && <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>No questions match filter</div>}
      </div>
    </div>
  );
}
