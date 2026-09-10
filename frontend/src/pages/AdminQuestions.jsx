export default function AdminQuestions() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Question Bank Management</h1>
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <p style={{ color: '#6b7280' }}>M3: GET/POST/PUT/DELETE /api/questions + filters by domain/difficulty/type. Placeholder table.</p>
        <div style={{ marginTop: 12, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr', gap: 0, background: '#f9fafb', padding: '10px 12px', fontWeight: 600, fontSize: 13 }}>
            <span>Question</span><span>Type</span><span>Domain</span><span>Difficulty</span>
          </div>
          <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Seed 50 questions in M3 — will appear here</div>
        </div>
      </div>
    </div>
  );
}
