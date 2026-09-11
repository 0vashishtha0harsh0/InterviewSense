import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Alert, Badge, EmptyState, Icon, PageHeader } from '../components/ui.jsx';

const TYPES = ['HR', 'Behavioral', 'Technical', 'Domain-specific'];
const DOMAINS = ['AI/ML', 'Computer Science', 'Software Development', 'General'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const EMPTY_FORM = {
  question_text: '',
  interview_type: 'Technical',
  domain: 'AI/ML',
  role: 'ML Engineer',
  difficulty: 'medium',
  expected_concepts: '',
  keywords: '',
};

const DIFF_TONE = { easy: 'success', medium: 'warn', hard: 'danger' };

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ domain: '', difficulty: '', interview_type: '', search: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchQs = async () => {
    const params = {};
    if (filters.domain) params.domain = filters.domain;
    if (filters.difficulty) params.difficulty = filters.difficulty;
    if (filters.interview_type) params.interview_type = filters.interview_type;
    if (filters.search) params.search = filters.search;
    const res = await api.get('/api/questions', { params });
    setQuestions(res.data);
  };

  useEffect(() => {
    fetchQs();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        expected_concepts: form.expected_concepts.split(',').map((s) => s.trim()).filter(Boolean),
        keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean),
        follow_up_questions: [],
      };
      if (editing) {
        await api.put(`/api/questions/${editing}`, payload);
        setNotice('Question updated successfully.');
      } else {
        await api.post('/api/questions', payload);
        setNotice('Question added to the bank.');
      }
      resetForm();
      fetchQs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/api/questions/${id}`);
      fetchQs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed');
    }
  };

  const startEdit = (q) => {
    setEditing(q._id);
    setShowForm(true);
    setNotice('');
    setForm({
      question_text: q.question_text,
      interview_type: q.interview_type,
      domain: q.domain,
      role: q.role,
      difficulty: q.difficulty,
      expected_concepts: (q.expected_concepts || []).join(', '),
      keywords: (q.keywords || []).join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="page container">
      <PageHeader
        eyebrow="Admin"
        title={`Question bank — ${questions.length} question${questions.length === 1 ? '' : 's'}`}
        subtitle="Every interview is assembled from these questions. Keep concepts and keywords accurate so scoring stays meaningful."
        icon={<Icon name="book" size={14} />}
        actions={
          <button
            type="button"
            className={`btn ${showForm ? 'btn--outline' : 'btn--primary'}`}
            onClick={() => {
              if (showForm) resetForm();
              else {
                setForm(EMPTY_FORM);
                setEditing(null);
                setShowForm(true);
              }
            }}
          >
            <Icon name={showForm ? 'close' : 'plus'} size={16} />
            {showForm ? 'Close editor' : 'Add question'}
          </button>
        }
      />

      {(error || notice) && (
        <div style={{ marginBottom: 18 }}>
          <Alert
            tone={error ? 'error' : 'success'}
            icon={<Icon name={error ? 'close' : 'check'} size={15} />}
          >
            {error || notice}
          </Alert>
        </div>
      )}

      {/* ------------------------------ filters ------------------------------ */}
      <section className="card card--pad rise rise-1" style={{ marginBottom: 20 }}>
        <div className="row row--between row--wrap" style={{ marginBottom: 14 }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="stat-icon">
              <Icon name="target" size={16} />
            </span>
            <div>
              <div className="card-title" style={{ fontSize: '.94rem' }}>
                Filter the bank
              </div>
              <div className="card-sub">{activeFilters ? `${activeFilters} filter(s) active` : 'No filters applied'}</div>
            </div>
          </div>
          {activeFilters > 0 && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                const cleared = { domain: '', difficulty: '', interview_type: '', search: '' };
                setFilters(cleared);
                api.get('/api/questions').then((r) => setQuestions(r.data));
              }}
            >
              <Icon name="close" size={14} />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-4" style={{ gap: 10 }}>
          <select
            className="select"
            aria-label="Filter by domain"
            value={filters.domain}
            onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
          >
            <option value="">All domains</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="select"
            aria-label="Filter by difficulty"
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">All difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="select"
            aria-label="Filter by interview type"
            value={filters.interview_type}
            onChange={(e) => setFilters({ ...filters, interview_type: e.target.value })}
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            className="input"
            placeholder="Search question text…"
            value={filters.search}
            aria-label="Search questions"
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && fetchQs()}
          />
        </div>

        <div className="btn-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn--primary btn--sm" onClick={fetchQs}>
            <Icon name="target" size={14} />
            Apply filters
          </button>
        </div>
      </section>

      {/* ------------------------------- editor ------------------------------ */}
      {showForm && (
        <section className="card card--pad rise" style={{ marginBottom: 20 }}>
          <div className="row row--between row--wrap" style={{ marginBottom: 18 }}>
            <div className="row" style={{ gap: 10 }}>
              <span className="stat-icon">
                <Icon name={editing ? 'edit' : 'plus'} size={16} />
              </span>
              <div>
                <div className="card-title">{editing ? 'Edit question' : 'Add a new question'}</div>
                <div className="card-sub">
                  {editing ? 'Update the wording, concepts or metadata' : 'Concepts and keywords drive NLP concept-coverage scoring'}
                </div>
              </div>
            </div>
            {editing && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={resetForm}>
                <Icon name="close" size={14} />
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleCreate}>
            <div className="field">
              <label className="label" htmlFor="question_text">
                Question text
              </label>
              <textarea
                id="question_text"
                className="textarea"
                required
                minLength={10}
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
                placeholder="e.g. What is overfitting in machine learning?"
              />
            </div>

            <div className="grid grid-4" style={{ gap: 12 }}>
              <div className="field">
                <label className="label" htmlFor="q_type">
                  Type
                </label>
                <select
                  id="q_type"
                  className="select"
                  value={form.interview_type}
                  onChange={(e) => setForm({ ...form, interview_type: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="q_domain">
                  Domain
                </label>
                <select
                  id="q_domain"
                  className="select"
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                >
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="q_difficulty">
                  Difficulty
                </label>
                <select
                  id="q_difficulty"
                  className="select"
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="q_role">
                  Role
                </label>
                <input
                  id="q_role"
                  className="input"
                  placeholder="ML Engineer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="q_concepts">
                Expected concepts
              </label>
              <input
                id="q_concepts"
                className="input"
                placeholder="training data, unseen data, generalization, noise"
                value={form.expected_concepts}
                onChange={(e) => setForm({ ...form, expected_concepts: e.target.value })}
              />
              <span className="hint">Comma separated. Used to measure concept coverage.</span>
            </div>

            <div className="field">
              <label className="label" htmlFor="q_keywords">
                Keywords
              </label>
              <input
                id="q_keywords"
                className="input"
                placeholder="overfitting, training, test, generalization"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
              <span className="hint">Comma separated. Improves relevance matching for short answers.</span>
            </div>

            <div className="btn-row">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? <span className="spinner spinner--sm" /> : <Icon name={editing ? 'check' : 'plus'} size={16} />}
                {editing ? 'Save changes' : 'Add question'}
              </button>
              <button type="button" className="btn btn--outline" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* -------------------------------- list ------------------------------- */}
      <section className="card card--flush rise rise-2">
        <div className="card-head">
          <div>
            <div className="card-title">Questions</div>
            <div className="card-sub">Showing {questions.length} result{questions.length === 1 ? '' : 's'}</div>
          </div>
          <Badge tone="info">
            <Icon name="layers" size={12} /> Live bank
          </Badge>
        </div>

        {questions.length === 0 ? (
          <EmptyState
            icon="book"
            title="No questions match"
            message="Try clearing the filters, or add a new question to the bank."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '46%' }}>Question</th>
                  <th>Type</th>
                  <th>Domain</th>
                  <th>Difficulty</th>
                  <th>Concepts</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id}>
                    <td className="cell-strong" title={q.question_text}>
                      {q.question_text.slice(0, 92)}
                      {q.question_text.length > 92 ? '…' : ''}
                    </td>
                    <td>
                      <Badge tone="neutral">{q.interview_type}</Badge>
                    </td>
                    <td className="small">{q.domain}</td>
                    <td>
                      <Badge tone={DIFF_TONE[q.difficulty] || 'neutral'}>{q.difficulty}</Badge>
                    </td>
                    <td className="tiny dim">{q.expected_concepts?.length || 0}</td>
                    <td>
                      <div className="cell-actions">
                        <button type="button" className="btn btn--outline btn--icon" title="Edit" onClick={() => startEdit(q)}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--icon"
                          title="Delete"
                          onClick={() => handleDelete(q._id)}
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
