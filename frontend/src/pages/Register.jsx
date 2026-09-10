import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.msg || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <form onSubmit={onSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: 400 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Create account</h1>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>Join InterviewSense</p>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Name</label>
        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Candidate" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 14 }} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Email</label>
        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="candidate@example.com" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 14 }} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Password</label>
        <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="min 6 chars" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 18 }} />
        <button disabled={loading} style={{ width: '100%', padding: 11, borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Creating...' : 'Create account'}</button>
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>Have account? <Link to="/login" style={{ color: '#4f46e5' }}>Login</Link></p>
      </form>
    </div>
  );
}
