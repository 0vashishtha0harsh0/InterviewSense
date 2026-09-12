/* ==========================================================================
   Shared presentation primitives.
   One place to change a card, a ring or an icon instead of forty inline
   style objects scattered across the pages.
   ========================================================================== */
import { useId, useState } from 'react';

/* --------------------------------------------------------------------------
   Icon — single stroke-based set so every glyph shares weight and rounding.
   -------------------------------------------------------------------------- */
const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  mic: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 18v4M8 22h8" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-3.6 8-10V5.5L12 2 4 5.5V12c0 6.4 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  play: (
    <>
      <path d="M6 4.5l13 7.5-13 7.5z" />
    </>
  ),
  replay: (
    <>
      <path d="M21 4v6h-6" />
      <path d="M3 20v-6h6" />
      <path d="M4.6 9A8 8 0 0 1 18.4 6.6L21 10M3 14l2.6 3.4A8 8 0 0 0 19.4 15" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  video: (
    <>
      <path d="M23 7.5l-6 4.5 6 4.5z" />
      <rect x="1.5" y="5" width="15" height="14" rx="2.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trend: (
    <>
      <path d="M22 7l-8.5 8.5-4-4L2 19" />
      <path d="M16 7h6v6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.4 14.3L7 22l5-2.6L17 22l-1.4-7.7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.4l3.5 2" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6.5A2.5 2.5 0 0 0 4 4.5v15A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V8z" />
      <path d="M14 2v6h6" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 6h17" />
      <path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6" />
      <path d="M18.5 6l-.9 13.1A2 2 0 0 1 15.6 21H8.4a2 2 0 0 1-2-1.9L5.5 6" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H5.5A2.5 2.5 0 0 0 3 6.5v12A2.5 2.5 0 0 0 5.5 21h12a2.5 2.5 0 0 0 2.5-2.5V13" />
      <path d="M18.4 2.6a2 2 0 0 1 2.9 2.8L12 14.7 8 15.6l1-4z" />
    </>
  ),
  arrow: <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />,
  chevron: <path d="M6 9.5l6 6 6-6" />,
  chart: <path d="M18 20V10M12 20V4M6 20v-6" />,
  sparkle: (
    <>
      <path d="M12 3l1.8 4.9L18.7 9.7l-4.9 1.8L12 16.4l-1.8-4.9L5.3 9.7l4.9-1.8z" />
      <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  check: <path d="M20 6.5L9.5 17 4 11.5" />,
  close: <path d="M18 6L6 18M6 6l12 12" />,
  lock: (
    <>
      <rect x="3.5" y="10.5" width="17" height="11" rx="2.5" />
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="M22 7l-10 6.5L2 7" />
    </>
  ),
  layers: (
    <>
      <path d="M12 2.5L2.5 7.5 12 12.5l9.5-5z" />
      <path d="M2.5 16.5L12 21.5l9.5-5M2.5 12L12 17l9.5-5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  zap: <path d="M13.5 2L4 13.5h7L10.5 22 20 10.5h-7z" />,
  activity: <path d="M22 12h-4.5l-3 8.5L9.5 3.5l-3 8.5H2" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  wand: (
    <>
      <path d="M4 20L15 9M17 3v4M21 8h-4M18.5 5.5l-2 2" />
      <path d="M14 4.5L15 3M9.5 14l1.5-1.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 4v6h-6" />
      <path d="M3 20v-6h6" />
      <path d="M4.6 9A8 8 0 0 1 18 6.6L21 10M3 14l3 3.4A8 8 0 0 0 19.4 15" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v16H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v4H6.5A2.5 2.5 0 0 1 4 20.5z" />
    </>
  ),
};

export function Icon({ name, size = 18, strokeWidth = 1.8, className = '', ...rest }) {
  const glyph = ICONS[name];
  if (!glyph) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {glyph}
    </svg>
  );
}

/* --------------------------------------------------------------------------
   Brand mark
   -------------------------------------------------------------------------- */
export function LogoMark({ size = 36 }) {
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 15V9M8 18V6M12 20V4M16 18V6M20 15V9"
          stroke="#fff"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* --------------------------------------------------------------------------
   Score helpers — one shared mapping so colour always means the same thing.
   -------------------------------------------------------------------------- */
export function scoreTone(score) {
  const n = Number(score);
  if (score == null || score === '' || Number.isNaN(n)) return 'neutral';
  if (n >= 80) return 'success';
  if (n >= 60) return 'warn';
  return 'danger';
}

export function scoreCategory(score) {
  const n = Number(score);
  if (score == null || score === '' || Number.isNaN(n)) return 'Not available';
  if (n >= 90) return 'Excellent';
  if (n >= 80) return 'Very Good';
  if (n >= 70) return 'Good';
  if (n >= 60) return 'Needs Improvement';
  return 'Needs Significant Improvement';
}

export function statusTone(status) {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'danger';
  return 'warn';
}

function clampScore(score) {
  const n = Number(score);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`badge badge--${tone} ${className}`}>{children}</span>;
}

export function Alert({ tone = 'info', icon, children, className = '' }) {
  return (
    <div className={`alert alert--${tone} ${className}`} role={tone === 'error' ? 'alert' : undefined}>
      {icon && <span className="alert-icon">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   ScoreRing — animated circular gauge for the final dashboard.
   -------------------------------------------------------------------------- */
export function ScoreRing({ value, label, caption, size = 150, stroke = 11, tone }) {
  const gradientId = useId().replace(/:/g, '');
  const resolvedTone = tone || scoreTone(value);
  const hasValue = value != null && value !== '' && !Number.isNaN(Number(value));
  const pct = hasValue ? clampScore(value) : 0;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  const palettes = {
    success: ['#0f8a5f', '#10b981'],
    warn: ['#b45309', '#f59e0b'],
    danger: ['#dc2626', '#ef4444'],
    brand: ['#1e3a5f', '#3a6491'],
    violet: ['#2e5077', '#5b7ba1'],
    cyan: ['#0e7490', '#0891b2'],
    neutral: ['#64748b', '#94a3b8'],
  };
  const [from, to] = palettes[resolvedTone] || palettes.brand;

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={`ring-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#ring-${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-val"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,0.61,0.36,1)' }}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-number" style={{ fontSize: size * 0.27 }}>
          {hasValue ? Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1) : '--'}
          <small>/100</small>
        </div>
        {label && <div className="ring-caption" style={{ marginTop: 6 }}>{label}</div>}
        {caption && (
          <div className="tiny" style={{ color: 'var(--text-3)', marginTop: 2 }}>{caption}</div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   Sparkline — fixed pixel size, so it never distorts.
   -------------------------------------------------------------------------- */
export function Sparkline({ points = [], width = 116, height = 38, tone = 'brand' }) {
  const valid = points.filter((p) => p != null && !Number.isNaN(Number(p)));
  if (valid.length < 2) return null;

  const palette = {
    brand: ['#1e3a5f', '#0e7490'],
    success: ['#0f8a5f', '#10b981'],
    warn: ['#b45309', '#f59e0b'],
  };
  const [from, to] = palette[tone] || palette.brand;
  const id = `spark-${tone}`;
  const pad = 4;
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (valid.length - 1);
  const coords = valid.map((v, i) => [
    pad + i * stepX,
    height - pad - ((v - min) / span) * (height - pad * 2),
  ]);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${id}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={from} stopOpacity="0.35" />
          <stop offset="100%" stopColor={from} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id}-fill)`} />
      <polyline points={line} fill="none" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.8" fill={to} />
    </svg>
  );
}

/* --------------------------------------------------------------------------
   TrendChart — responsive CSS bar chart (no SVG stretching artefacts).
   -------------------------------------------------------------------------- */
export function TrendChart({ scores = [] }) {
  const [hover, setHover] = useState(null);
  const valid = scores.filter((s) => s != null && !Number.isNaN(Number(s)));
  if (valid.length < 2) return null;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          height: 168,
          padding: '0 4px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {valid.map((score, i) => {
          const tone = score >= 70 ? 'success' : score >= 60 ? 'warn' : 'danger';
          const fill =
            tone === 'success'
              ? 'linear-gradient(180deg,#1e3a5f,#3a6491)'
              : tone === 'warn'
                ? 'linear-gradient(180deg,#b45309,#f59e0b)'
                : 'linear-gradient(180deg,#dc2626,#ef4444)';
          return (
            <div
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 8,
                height: '100%',
                position: 'relative',
              }}
            >
              <span
                className="tiny mono"
                style={{
                  color: 'var(--text)',
                  fontWeight: 700,
                  opacity: hover === null || hover === i ? 1 : 0.4,
                  transition: 'opacity .2s',
                }}
              >
                {Number(score).toFixed(0)}
              </span>
              <div
                title={`Session ${i + 1}: ${score}/100`}
                style={{
                  width: '100%',
                  maxWidth: 54,
                  height: `${Math.max(6, score)}%`,
                  background: fill,
                  borderRadius: '8px 8px 0 0',
                  boxShadow: hover === i ? '0 4px 16px rgba(30,58,95,.35)' : 'none',
                  transform: hover === i ? 'scaleX(1.06)' : 'none',
                  transformOrigin: 'bottom',
                  transition: 'transform .2s, box-shadow .2s',
                  minHeight: 8,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '8px 4px 0' }}>
        {valid.map((_, i) => (
          <span
            key={i}
            className="tiny"
            style={{ flex: 1, textAlign: 'center', color: hover === i ? 'var(--text)' : 'var(--text-3)' }}
          >
            S{i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
   StatCard
   -------------------------------------------------------------------------- */
export function StatCard({ label, value, suffix, hint, icon, tone = 'brand', delay = 0 }) {
  const tints = {
    brand: 'rgba(30,58,95,.14)',
    success: 'rgba(15,138,95,.14)',
    warn: 'rgba(180,83,9,.14)',
    danger: 'rgba(220,38,38,.14)',
    violet: 'rgba(46,80,119,.14)',
    cyan: 'rgba(14,116,144,.14)',
  };
  return (
    <div className={`stat${delay ? ` rise rise-${delay}` : ''}`} style={{ '--stat-tint': tints[tone] || tints.brand }}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value">
        {value}
        {suffix && <small>{suffix}</small>}
      </div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

/* --------------------------------------------------------------------------
   PageHeader
   -------------------------------------------------------------------------- */
export function PageHeader({ eyebrow, title, subtitle, actions, icon }) {
  return (
    <header
      className="row row--between row--wrap rise"
      style={{ marginBottom: 26, alignItems: 'flex-end', gap: 18 }}
    >
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div className="eyebrow row" style={{ gap: 8, marginBottom: 10 }}>
            {icon}
            {eyebrow}
          </div>
        )}
        <h1 className="h1">{title}</h1>
        {subtitle && <p className="muted" style={{ marginTop: 8, fontSize: '.9rem' }}>{subtitle}</p>}
      </div>
      {actions && <div className="btn-row">{actions}</div>}
    </header>
  );
}

/* --------------------------------------------------------------------------
   EmptyState & Loader
   -------------------------------------------------------------------------- */
export function EmptyState({ icon = 'sparkle', title, message, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} size={24} />
      </div>
      <div>
        <div className="strong" style={{ fontSize: '1rem' }}>{title}</div>
        {message && <p className="dim small" style={{ marginTop: 6, maxWidth: 380 }}>{message}</p>}
      </div>
      {action}
    </div>
  );
}

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <div className="spinner spinner--lg" />
      <span>{label}</span>
    </div>
  );
}

export function Meter({ label, value, tone }) {
  const resolved = tone || scoreTone(value);
  const has = value != null && value !== '' && !Number.isNaN(Number(value));
  return (
    <div className="meter">
      <div className="meter-head">
        <span>{label}</span>
        <span className="meter-value">{has ? Number(value).toFixed(Number(value) % 1 === 0 ? 0 : 1) : '--'}</span>
      </div>
      <div className="bar">
        <div className={`bar-fill bar-fill--${resolved}`} style={{ width: `${has ? clampScore(value) : 0}%` }} />
      </div>
    </div>
  );
}
