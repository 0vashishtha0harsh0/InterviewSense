import { useAuth } from '../context/AuthContext.jsx';
export default function Profile() {
  const { user } = useAuth();
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Profile</h1>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>M2: GET /api/auth/me verified. Edit profile stretch for M8.</p>
      </div>
    </div>
  );
}
