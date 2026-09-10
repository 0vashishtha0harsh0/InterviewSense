import { Link } from 'react-router-dom';
export default function Admin() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Admin Dashboard</h1>
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <p style={{ color: '#6b7280' }}>M1 scaffold — M2 role guard active. M8: question management CRUD.</p>
        <Link to="/admin/questions" style={{ display: 'inline-block', marginTop: 12, padding: '8px 14px', background: '#7c3aed', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>Manage Questions</Link>
      </div>
    </div>
  );
}
