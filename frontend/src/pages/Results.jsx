import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api.js';
import {
  Badge,
  EmptyState,
  Icon,
  Loader,
  Meter,
  PageHeader,
  ScoreRing,
  scoreCategory,
  scoreTone,
} from '../components/ui.jsx';

const NLP_FIELDS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'concept_coverage', label: 'Concept coverage' },
  { key: 'completeness', label: 'Completeness' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'fluency', label: 'Fluency' },
];

const CV_FIELDS = [
  { key: 'face_presence', label: 'Face presence', suffix: '%' },
  { key: 'eye_contact', label: 'Camera-directed gaze', suffix: '%' },
  { key: 'movement_indicator', label: 'Movement stability', suffix: '' },
];

function avg(values) {
  const valid = values.filter((v) => v != null && !Number.isNaN(Number(v)));
  if (!valid.length) return null;
  return Number((valid.reduce((a, b) => a + Number(b), 0) / valid.length).toFixed(1));
}

export default function Results() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(0);

  useEffect(() => {
    api
      .get(`/api/interviews/${id}`)
      .then((r) => setSession(r.data))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load results'));
  }, [id]);

  if (error) {
    return (
      <div className="page container container--narrow">
        <div className="card card--pad-lg center">
          <h1 className="h2">Couldn’t load this report</h1>
          <p className="muted" style={{ marginTop: 10 }}>{error}</p>
          <Link to="/dashboard" className="btn btn--primary" style={{ marginTop: 20 }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page container">
        <Loader label="Generating your performance dashboard…" />
      </div>
    );
  }

  const answers = session.answers || [];
  const contentAvg = avg(answers.map((a) => a.content_score));
  const deliveryAvg = avg(answers.map((a) => a.delivery_score));
  const overall =
    session.overall_score ?? avg(answers.map((a) => a.overall_score));

  const strengthCounts = answers
    .flatMap((a) => a.feedback?.strengths || [])
    .reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});
  const improveCounts = answers
    .flatMap((a) => a.feedback?.improvements || [])
    .reduce((acc, s) => ({ ...acc, [s]: (acc[s] || 0) + 1 }), {});

  const topStrength =
    Object.entries(strengthCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    (overall != null && overall >= 70 ? 'Good relevance and structure' : 'Completed a full interview');
  const topImprove =
    Object.entries(improveCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Maintain consistency';

  const recommendations = [...new Set(answers.flatMap((a) => a.feedback?.recommendations || []))].slice(0, 5);
  if (recommendations.length === 0) {
    recommendations.push(
      overall != null && overall < 60
        ? 'Practise answering aloud with a clear structure and fewer filler words.'
        : 'Keep running mock interviews to maintain this level of performance.',
    );
  }

  return (
    <div className="page container">
      <PageHeader
        eyebrow="Final performance dashboard"
        title="Interview analysis report"
        subtitle={`${session.interview_type} · ${session.domain} · ${session.role} · completed ${
          session.completed_at ? new Date(session.completed_at).toLocaleString() : 'just now'
        }`}
        icon={<Icon name="award" size={14} />}
        actions={
          <>
            <Link to="/dashboard" className="btn btn--outline">
              <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
              Dashboard
            </Link>
            <Link to="/interview/setup" className="btn btn--primary">
              <Icon name="plus" size={16} />
              New interview
            </Link>
          </>
        }
      />

      {/* --------------------------- score rings --------------------------- */}
      <section className="card card--pad-lg rise rise-1" style={{ marginBottom: 20 }}>
        <div className="score-hero">
          <ScoreRing value={overall} label="Overall" caption={scoreCategory(overall)} size={190} stroke={13} />
          <div className="score-hero-side">
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Session verdict
              </div>
              <h2 className="h1" style={{ fontSize: '1.5rem' }}>
                {scoreCategory(overall)}
              </h2>
              <p className="muted small" style={{ marginTop: 8, maxWidth: 520 }}>
                Overall combines content quality (70%) with non-verbal delivery (30%). Expand any
                question below to see exactly which signals produced each score.
              </p>
            </div>

            <div className="grid grid-2">
              <div className="row" style={{ gap: 16 }}>
                <ScoreRing value={contentAvg} label="Content" size={112} stroke={10} tone="success" />
                <div>
                  <div className="card-title" style={{ fontSize: '.92rem' }}>
                    Answer quality
                  </div>
                  <p className="hint" style={{ marginTop: 6, maxWidth: 190 }}>
                    Relevance, concept coverage, completeness, clarity, grammar and fluency.
                  </p>
                  <Badge tone={scoreTone(contentAvg)} className="tiny" >
                    {scoreCategory(contentAvg)}
                  </Badge>
                </div>
              </div>

              <div className="row" style={{ gap: 16 }}>
                <ScoreRing value={deliveryAvg} label="Delivery" size={112} stroke={10} tone="violet" />
                <div>
                  <div className="card-title" style={{ fontSize: '.92rem' }}>
                    Non-verbal delivery
                  </div>
                  <p className="hint" style={{ marginTop: 6, maxWidth: 190 }}>
                    Observable signals only — face presence, camera-directed gaze and movement.
                  </p>
                  <Badge tone={scoreTone(deliveryAvg)}>{scoreCategory(deliveryAvg)}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------- strengths / improvements ---------------------- */}
      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <section className="card card--pad rise rise-2" style={{ borderColor: 'rgba(52,211,153,.28)' }}>
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <span className="stat-icon" style={{ color: 'var(--emerald)' }}>
              <Icon name="award" size={16} />
            </span>
            <span className="card-title" style={{ fontSize: '.95rem' }}>
              Strongest area
            </span>
          </div>
          <p style={{ fontSize: '1.02rem', fontWeight: 600, color: '#6ee7b7' }}>{topStrength}</p>
          <div className="gap-list" style={{ marginTop: 16 }}>
            {Object.entries(strengthCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([s, n]) => (
                <span key={s} className="chip">
                  {s} <span className="dim">×{n}</span>
                </span>
              ))}
          </div>
        </section>

        <section className="card card--pad rise rise-3" style={{ borderColor: 'rgba(251,113,133,.28)' }}>
          <div className="row" style={{ gap: 10, marginBottom: 14 }}>
            <span className="stat-icon" style={{ color: 'var(--rose)' }}>
              <Icon name="target" size={16} />
            </span>
            <span className="card-title" style={{ fontSize: '.95rem' }}>
              Needs improvement
            </span>
          </div>
          <p style={{ fontSize: '1.02rem', fontWeight: 600, color: '#fda4af' }}>{topImprove}</p>
          <div className="gap-list" style={{ marginTop: 16 }}>
            {Object.entries(improveCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([s, n]) => (
                <span key={s} className="chip">
                  {s} <span className="dim">×{n}</span>
                </span>
              ))}
          </div>
        </section>
      </div>

      {/* ------------------------- recommendations ------------------------- */}
      <section className="card card--flush rise rise-3" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Recommendations</div>
            <div className="card-sub">Derived from the measured scores for each answer</div>
          </div>
          <Badge tone="violet">{recommendations.length} suggested</Badge>
        </div>
        <div className="card-body">
          {recommendations.map((r, i) => (
            <div key={r} className="reco">
              <span className="reco-index">{i + 1}</span>
              <p className="small" style={{ color: 'var(--text-2)', lineHeight: 1.65 }}>
                {r}
              </p>
            </div>
          ))}
          <p className="hint" style={{ marginTop: 16 }}>
            Feedback is generated from measurable NLP and vision signals only. The system does not make
            psychological claims about how you felt.
          </p>
        </div>
      </section>

      {/* -------------------------- question breakdown -------------------------- */}
      <section className="card card--flush rise rise-4">
        <div className="card-head">
          <div>
            <div className="card-title">Question-wise breakdown</div>
            <div className="card-sub">
              {answers.length} answer{answers.length === 1 ? '' : 's'} · hidden during the interview, revealed here
            </div>
          </div>
          <Badge tone="info">
            <Icon name="book" size={12} /> Transcripts
          </Badge>
        </div>

        <div className="card-body">
          {answers.length === 0 ? (
            <EmptyState icon="book" title="No answers recorded" message="This session has no stored answers yet." />
          ) : (
            answers.map((a, i) => {
              const q = session.questions?.[i];
              const isOpen = open === i;
              const tone = scoreTone(a.overall_score);
              return (
                <div key={a._id || i} className="qa">
                  <button
                    type="button"
                    className="qa-head"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                  >
                    <span className="qa-title">
                      <span className="qa-q">
                        <span className="dim mono">Q{i + 1}</span> {q?.question_text?.slice(0, 95) ?? a.question_id}
                        {q?.question_text?.length > 95 ? '…' : ''}
                      </span>
                      <span className="qa-meta">
                        {q?.difficulty && <Badge tone="neutral">{q.difficulty}</Badge>}
                        {q?.is_personalized && <Badge tone="violet">Resume-aware</Badge>}
                        <span>
                          {a.is_mock ? 'Estimated from partial metrics' : 'Fully analysed'}
                        </span>
                      </span>
                    </span>

                    <span className="qa-scores">
                      <span className="qa-score">
                        <span className="qa-score-k">Content</span>
                        <span className="qa-score-v">{a.content_score ?? '--'}</span>
                      </span>
                      <span className="qa-score">
                        <span className="qa-score-k">Delivery</span>
                        <span className="qa-score-v">{a.delivery_score ?? '--'}</span>
                      </span>
                      <span className="qa-score">
                        <span className="qa-score-k">Overall</span>
                        <span className="qa-score-v" style={{ color: tone === 'success' ? '#6ee7b7' : tone === 'warn' ? '#fcd34d' : '#fda4af' }}>
                          {a.overall_score ?? '--'}
                        </span>
                      </span>
                      <span className="row" style={{ gap: 6, alignSelf: 'center' }}>
                        <Icon
                          name="chevron"
                          size={16}
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}
                        />
                      </span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="qa-body">
                      <div className="grid grid-2" style={{ gap: 20, alignItems: 'start' }}>
                        {/* content metrics */}
                        <div className="stack" style={{ gap: 14 }}>
                          <div className="row" style={{ gap: 8 }}>
                            <Icon name="book" size={15} />
                            <span className="label" style={{ margin: 0 }}>
                              Content analysis
                            </span>
                          </div>

                          {a.nlp_metrics ? (
                            <div className="stack" style={{ gap: 12 }}>
                              {NLP_FIELDS.map((f) => (
                                <Meter key={f.key} label={f.label} value={a.nlp_metrics[f.key]} />
                              ))}
                            </div>
                          ) : (
                            <p className="hint">Content metrics are unavailable for this answer.</p>
                          )}

                          {a.nlp_metrics?.missing_concepts?.length > 0 && (
                            <div>
                              <div className="label" style={{ marginBottom: 8 }}>
                                Missing concepts
                              </div>
                              <div className="gap-list">
                                {a.nlp_metrics.missing_concepts.slice(0, 6).map((c) => (
                                  <span key={c} className="chip" style={{ color: '#fcd34d' }}>
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* delivery metrics */}
                        <div className="stack" style={{ gap: 14 }}>
                          <div className="row" style={{ gap: 8 }}>
                            <Icon name="eye" size={15} />
                            <span className="label" style={{ margin: 0 }}>
                              Delivery analysis
                            </span>
                          </div>

                          {a.cv_metrics && !a.cv_metrics.error ? (
                            <div className="stack" style={{ gap: 12 }}>
                              {CV_FIELDS.map((f) => (
                                <Meter
                                  key={f.key}
                                  label={`${f.label}${f.suffix}`}
                                  value={a.cv_metrics[f.key]}
                                />
                              ))}
                              <div className="row row--between small">
                                <span className="dim">Blink rate</span>
                                <span className="mono">
                                  {a.cv_metrics.blink_rate != null ? `${a.cv_metrics.blink_rate}/min` : '--'}
                                </span>
                              </div>
                              {a.cv_metrics.frames_analyzed != null && (
                                <div className="row row--between small">
                                  <span className="dim">Frames analysed</span>
                                  <span className="mono">{a.cv_metrics.frames_analyzed}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="hint">
                              {a.cv_metrics?.error
                                ? `Video: ${a.cv_metrics.error}`
                                : 'No video supplied for this answer, so delivery could not be measured.'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* transcript */}
                      <div style={{ marginTop: 20 }}>
                        <div className="label" style={{ marginBottom: 8 }}>
                          Transcript
                        </div>
                        <div className="qa-transcript">
                          {a.transcript
                            ? a.transcript
                            : a.whisper_error || 'No transcript — the recording was silent or no audio was provided.'}
                        </div>
                      </div>

                      {/* per-question feedback */}
                      {a.feedback && (a.feedback.strengths?.length > 0 || a.feedback.improvements?.length > 0) && (
                        <div className="grid grid-2" style={{ gap: 12, marginTop: 18 }}>
                          {a.feedback.strengths?.length > 0 && (
                            <div className="feedback-block feedback-block--good">
                              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                                <Icon name="check" size={14} style={{ color: 'var(--emerald)' }} />
                                <span className="label" style={{ margin: 0 }}>
                                  Strengths
                                </span>
                              </div>
                              <div className="gap-list">
                                {a.feedback.strengths.map((s) => (
                                  <span key={s} className="chip">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {a.feedback.improvements?.length > 0 && (
                            <div className="feedback-block feedback-block--bad">
                              <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                                <Icon name="target" size={14} style={{ color: 'var(--rose)' }} />
                                <span className="label" style={{ margin: 0 }}>
                                  Improve
                                </span>
                              </div>
                              <div className="gap-list">
                                {a.feedback.improvements.map((s) => (
                                  <span key={s} className="chip">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="row row--between row--wrap rise" style={{ marginTop: 24 }}>
        <Link to="/dashboard" className="btn btn--ghost">
          <Icon name="arrow" size={15} style={{ transform: 'rotate(180deg)' }} />
          Back to dashboard
        </Link>
        <Link to="/interview/setup" className="btn btn--outline">
          Retake with different settings
          <Icon name="arrow" size={15} />
        </Link>
      </div>
    </div>
  );
}
