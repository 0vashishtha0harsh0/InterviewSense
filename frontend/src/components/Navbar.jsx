import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  if (!user) return null;
  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 24px', borderBottom: '1px solid #e5e7eb', background: '#fff',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <Link to="/dashboard" style={{ fontWeight: 700, fontSize: 20, color: '#4f46e5', textDecoration: 'none' }}>InterviewSense</Link>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link to="/dashboard" style={{ textDecoration: 'none', color: '#374151' }}>Dashboard</Link>
        <Link to="/interview/setup" style={{ textDecoration: 'none', color: '#374151' }}>New Interview</Link>
        <Link to="/profile" style={{ textDecoration: 'none', color: '#374151' }}>Profile</Link>
        {isAdmin && <Link to="/admin" style={{ textDecoration: 'none', color: '#7c3aed', fontWeight: 600 }}>Admin</Link>}
        <span style={{ color: '#6b7280', fontSize: 14 }}>{user.name} ({user.role})</span>
        <button onClick={handleLogout} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Logout</button>
      </div>
    </nav>
  );
}
