import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      navigate(u.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <form onSubmit={onSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', width: 400 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ color: '#6b7280', marginBottom: 20 }}>Login to InterviewSense</p>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 14 }}>{error}</div>}
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Email</label>
        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="candidate@example.com" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 14 }} />
        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Password</label>
        <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #d1d5db', marginBottom: 18 }} />
        <button disabled={loading} style={{ width: '100%', padding: 11, borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Logging in...' : 'Login'}</button>
        <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>No account? <Link to="/register" style={{ color: '#4f46e5' }}>Register</Link></p>
        <p style={{ marginTop: 8, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>M1: Backend /api/health must be ok</p>
      </form>
    </div>
  );
}
