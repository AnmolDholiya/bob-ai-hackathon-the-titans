// ─────────────────────────────────────────────────────────────────────────────
// VesselCard — compact card for a single vessel in the fleet list
// Accepts either a mockData vessel shape or a VesselRead (backend) shape.
// Optional onPredict(vessel) triggers a real ML prediction from the parent.
// ─────────────────────────────────────────────────────────────────────────────
import { StatusBadge, RiskBadge } from './GlassUI'

// ── Normalise both data shapes into a common display object ──────────────────
function normalise(vessel) {
  // Backend VesselRead shape
  if (vessel.vessel_name !== undefined) {
    return {
      id:              vessel.id,
      name:            vessel.vessel_name,
      imo:             vessel.imo_number,
      status:          _mapStatus(vessel.status),
      currentLocation: vessel.current_location   ?? '—',
      departurePort:   vessel.departure_port_code ?? '—',
      arrivalPort:     vessel.arrival_port_code   ?? '—',
      eta:             vessel.scheduled_eta       ? vessel.scheduled_eta.slice(0, 10) : '—',
      delay:           vessel.delay_hours         != null ? +(vessel.delay_hours / 24).toFixed(1) : 0,
      speed:           vessel.speed_knots         ?? 0,
      congestionRisk:  _mapRisk(vessel.congestion_risk),
      _raw:            vessel,
    }
  }
  // mockData shape (already display-ready)
  return { ...vessel, _raw: vessel }
}

function _mapStatus(s) {
  const map = { active: 'Active', en_route: 'En Route', berthed: 'Berthed', delayed: 'Delayed', inactive: 'Inactive' }
  return map[s] ?? s ?? 'Unknown'
}

function _mapRisk(r) {
  const map = { low: 'Low', medium: 'Medium', high: 'High' }
  return map[r] ?? 'Low'
}

// ── Prediction result mini-panel ──────────────────────────────────────────────
function PredictionPanel({ prediction, loading, error }) {
  if (loading) {
    return (
      <div style={{
        marginTop: 10, padding: '10px 12px', borderRadius: 8,
        background: 'rgba(6,214,199,0.06)', border: '1px solid rgba(6,214,199,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
          Running ML prediction…
        </span>
      </div>
    )
  }
  if (error) {
    return (
      <div style={{
        marginTop: 10, padding: '10px 12px', borderRadius: 8,
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(239,68,68,0.85)' }}>{error}</span>
      </div>
    )
  }
  if (!prediction) return null

  const score   = prediction.congestion_risk_score
  const label   = prediction.congestion_risk_label      // "Normal" | "Congestion Risk"
  const flag    = prediction.congestion_risk_flag        // 0 | 1
  const thresh  = prediction.threshold
  const pct     = Math.round(score * 100)
  const color   = flag === 1 ? '#ef4444' : score > thresh * 0.7 ? '#f59e0b' : '#06d6c7'

  return (
    <div style={{
      marginTop: 10, padding: '10px 12px', borderRadius: 8,
      background: flag === 1 ? 'rgba(239,68,68,0.08)' : 'rgba(6,214,199,0.06)',
      border: `1px solid ${flag === 1 ? 'rgba(239,68,68,0.22)' : 'rgba(6,214,199,0.18)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {pct}% congestion probability
        </span>
      </div>
      {/* Probability bar */}
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 2,
          background: color, transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(255,255,255,0.32)' }}>
        Threshold: {Math.round(thresh * 100)}% · XGBoost + LightGBM ensemble
      </div>
    </div>
  )
}

// ── VesselCard ────────────────────────────────────────────────────────────────
export default function VesselCard({ vessel, index = 0, onPredict, prediction, predLoading, predError }) {
  const v = normalise(vessel)

  return (
    <div
      className="glass"
      style={{
        padding:   '14px 16px',
        display:   'flex',
        flexDirection: 'column',
        gap:       10,
        animation: `vessel-travel 0.4s ${0.06 * index}s ease both`,
        cursor:    'default',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(6,214,199,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Top row — name + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {v.name}
        </span>
        <StatusBadge value={v.status} />
      </div>

      {/* Route line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.52)' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{v.departurePort}</span>
        <svg viewBox="0 0 24 4" style={{ width: 20, height: 4, flexShrink: 0 }}>
          <line x1="0" y1="2" x2="24" y2="2" stroke="rgba(6,214,199,0.4)" strokeWidth="1.5" strokeDasharray="3 2"/>
        </svg>
        <span style={{ color: '#06d6c7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{v.arrivalPort}</span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>ETA</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}>{v.eta}</p>
        </div>
        <div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Delay</p>
          <p style={{ fontSize: 12, fontWeight: 600, color: v.delay === 0 ? '#06d6c7' : v.delay <= 1 ? '#f59e0b' : '#ef4444' }}>
            {v.delay === 0 ? 'On Time' : `+${v.delay}d`}
          </p>
        </div>
        <div>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Speed</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}>{v.speed} kn</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <RiskBadge value={v.congestionRisk} />
        </div>
      </div>

      {/* Current location */}
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 11, height: 11, flexShrink: 0 }}>
            <path d="M12 2a7 7 0 017 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 017-7z" strokeLinecap="round"/>
            <circle cx="12" cy="9" r="2"/>
          </svg>
          {v.currentLocation}
        </span>

        {/* Predict button — shown when onPredict is provided and no result yet */}
        {onPredict && !prediction && !predLoading && (
          <button
            onClick={() => onPredict(vessel)}
            style={{
              fontSize: 10, fontWeight: 600, color: '#06d6c7',
              background: 'rgba(6,214,199,0.10)', border: '1px solid rgba(6,214,199,0.25)',
              borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,214,199,0.20)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,214,199,0.10)'}
          >
            Run Prediction
          </button>
        )}
      </div>

      {/* Inline prediction result */}
      <PredictionPanel prediction={prediction} loading={predLoading} error={predError} />
    </div>
  )
}
