// ─────────────────────────────────────────────────────────────────────────────
// Shared UI primitives — PORTMIND
// ─────────────────────────────────────────────────────────────────────────────

// ── GlassCard ─────────────────────────────────────────────────────────────────
export function GlassCard({ children, className = '', dark = false }) {
  return (
    <div className={`${dark ? 'glass-dark' : 'glass'} ${className}`}>
      {children}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const ICON_MAP = {
  vessel: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17l9 3 9-3M12 3v14M5 10l7-2 7 2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 7l9 4 9-4M12 11v10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  anchor: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="6" r="2"/><path d="M12 8v12M6 12H4a8 8 0 0016 0h-2M8 12h8" strokeLinecap="round"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
}

export function KPICard({ label, value, icon }) {
  return (
<<<<<<< HEAD
    <div className="glass flex items-center gap-4 px-5 py-4 animate-fade-in hover:scale-[1.02] transition-transform">
      <div className="text-cyan-400 opacity-80">{ICON_MAP[icon] ?? ICON_MAP.anchor}</div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-white/50 mt-1">{label}</p>
=======
    <div
      className="glass"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(6,214,199,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Teal icon box */}
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: 'rgba(6,214,199,0.13)',
        border: '1px solid rgba(6,214,199,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#06d6c7',
      }}>
        {ICON_MAP[icon] ?? ICON_MAP.anchor}
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1, margin: 0 }}>{value}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.48)', marginTop: 4, letterSpacing: '0.02em' }}>{label}</p>
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
      </div>
    </div>
  )
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  Active:        'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  'En Route':    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  Berthed:       'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Delayed:       'bg-red-500/20 text-red-300 border border-red-500/30',
  Operational:   'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Congested:     'bg-red-500/20 text-red-300 border border-red-500/30',
  Maintenance:   'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  Critical:      'bg-red-500/20 text-red-300 border border-red-500/30',
  High:          'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  Medium:        'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  Informational: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Active_alert:  'bg-red-500/20 text-red-300 border border-red-500/30',
  Acknowledged:  'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  Resolved:      'bg-white/10 text-white/50 border border-white/10',
  Low:           'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Queued:        'bg-white/10 text-white/60 border border-white/10',
  Incoming:      'bg-blue-500/20 text-blue-300 border border-blue-500/30',
}

export function StatusBadge({ value, size = 'sm' }) {
  const cls = BADGE_STYLES[value] ?? 'bg-white/10 text-white/60 border border-white/10'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'} ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse-dot" />
      {value}
    </span>
  )
}

// ── Risk Badge ────────────────────────────────────────────────────────────────
export function RiskBadge({ value }) {
  const map = { Low: 'text-emerald-400', Medium: 'text-amber-400', High: 'text-red-400' }
  const bars = { Low: 1, Medium: 2, High: 3 }
  const n = bars[value] ?? 1
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${map[value] ?? 'text-white/50'}`}>
      {[1,2,3].map(i => (
        <span key={i} className={`w-1 rounded-sm ${i <= n ? 'bg-current' : 'bg-white/10'}`} style={{ height: `${6 + i * 3}px` }} />
      ))}
      {value}
    </span>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, showLabel = false, colorClass }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const fill = colorClass ?? (pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-gradient-to-r from-cyan-400 to-blue-500')
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar flex-1">
        <div className={`progress-bar-fill ${fill}`} style={{ width: `${pct}%`, background: colorClass ? undefined : 'linear-gradient(90deg,#06d6c7,#0891b2)' }} />
      </div>
      {showLabel && <span className="text-xs text-white/60 w-9 text-right">{Math.round(pct)}%</span>}
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
<<<<<<< HEAD
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {action && <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">{action} →</button>}
=======
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '0.01em' }}>{title}</h2>
      {action && (
        <button style={{
          fontSize: 11, color: '#06d6c7', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
          transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#34d9d0'}
          onMouseLeave={e => e.currentTarget.style.color = '#06d6c7'}
        >
          {action} →
        </button>
      )}
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
    </div>
  )
}

// ── Data Table ────────────────────────────────────────────────────────────────
export function DataTable({ columns, rows, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map(c => (
              <th key={c.key} className={`py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wide text-left`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-white/5 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
            >
              {columns.map(c => (
                <td key={c.key} className="py-3 px-4 text-white/80">
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,13,30,0.85)' }}>
      <div className={`glass-dark w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} max-h-[90vh] overflow-y-auto animate-fade-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Search Input ──────────────────────────────────────────────────────────────
export function SearchInput({ placeholder, value, onChange }) {
  return (
    <div className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
      />
    </div>
  )
}

// ── Select Filter ─────────────────────────────────────────────────────────────
export function SelectFilter({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-cyan-500/50 transition-colors"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}
