import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import RouteEfficiency from '../components/RouteEfficiency'
import RouteOverview   from '../components/RouteOverview'
import VesselCard       from '../components/VesselCard'
import { SectionHeader } from '../components/GlassUI'
import { vesselsApi, predictionsApi } from '../services/api'

// ── Build a CongestionPredictionRequest from a VesselRead record ──────────────
// All fields are Optional on the backend — supply what we have, omit the rest.
// The sklearn pipeline imputes medians for everything left null.
function buildPredictionRequest(vessel) {
  const now = new Date()

  // Derive snapshot calendar fields from current time
  const snapHour  = now.getUTCHours()
  const snapDow   = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1  // Mon=0…Sun=6
  const snapMonth = now.getUTCMonth() + 1

  // Derive ETA calendar fields from scheduled_eta if available
  let etaHour = null, etaDow = null, etaMonth = null, leadTimeMin = null, etaGapMin = null
  if (vessel.scheduled_eta) {
    const eta = new Date(vessel.scheduled_eta)
    etaHour  = eta.getUTCHours()
    etaDow   = eta.getUTCDay() === 0 ? 6 : eta.getUTCDay() - 1
    etaMonth = eta.getUTCMonth() + 1
    leadTimeMin = (eta - now) / 60000   // ms → minutes
  }

  // eta_gap_min: delay_hours already stored on the vessel (predicted vs scheduled)
  if (vessel.delay_hours != null) {
    etaGapMin = vessel.delay_hours * 60
  }

  return {
    // Position / movement — stored directly on VesselRead
    sog: vessel.speed_knots ?? null,
    dep_port: vessel.departure_port_code ?? null,
    arr_port: vessel.arrival_port_code   ?? null,
    // Gap / lead-time
    eta_gap_min:   etaGapMin,
    lead_time_min: leadTimeMin != null ? Math.max(-1000, Math.min(1000, leadTimeMin)) : null,
    // Snapshot calendar (derived from now)
    snapshot_hour:  snapHour,
    snapshot_dow:   snapDow,
    snapshot_month: snapMonth,
    // ETA calendar (derived from scheduled_eta)
    eta_hour:  etaHour,
    eta_dow:   etaDow,
    eta_month: etaMonth,
    // Fields not available from VesselRead — omitted (backend imputes medians)
    // lat, long, cog, hdg, etd_gap_min, *_history_rate
  }
}

// ── Guidance rules (deterministic — NOT ML output) ────────────────────────────
const GUIDANCE = {
  'Congestion Risk': 'Prioritize berth and operational review.',
  'Normal':          'Continue normal monitoring.',
}
function riskGuidance(label) {
  return GUIDANCE[label] ?? 'Monitor berth availability and vessel progress.'
}

// ── Derive fleet risk summary from existing predMap state & vessel risk data ────
function fleetSummary(vessels, predMap) {
  const total    = vessels.length
  let analyzed = Object.values(predMap).filter(p => p.result).length
  let high     = Object.values(predMap).filter(p => p.result?.congestion_risk_flag === 1).length
  let normal   = Object.values(predMap).filter(p => p.result?.congestion_risk_flag === 0).length

  if (analyzed === 0 && vessels.length > 0) {
    analyzed = vessels.length
    high = vessels.filter(v => (v.congestion_risk || '').toLowerCase() === 'high' || (v.congestion_risk || '').toLowerCase() === 'medium').length
    normal = total - high
  }
  return { total, analyzed, high, normal }
}


// ── Top-N vessels by real congestion_risk_score ───────────────────────────────
function priorityVessels(vessels, predMap, n = 3) {
  return vessels
    .map(v => ({ vessel: v, pred: predMap[v.id]?.result ?? null }))
    .filter(x => x.pred !== null)
    .sort((a, b) => b.pred.congestion_risk_score - a.pred.congestion_risk_score)
    .slice(0, n)
}

export default function HomePage() {
  const navigate = useNavigate()

  // ── Live vessel list from backend ─────────────────────────────────────────
  const [vessels,  setVessels]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [apiError, setApiError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setApiError(null)
    vesselsApi.list()
      .then(data => { if (!cancelled) { setVessels(data); setLoading(false) } })
      .catch(err  => { if (!cancelled) { setApiError(err?.message ?? 'Backend unavailable'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  // ── Per-vessel prediction state (keyed by vessel id) ──────────────────────
  // { [id]: { loading, result, error } }
  const [predMap, setPredMap] = useState({})

  const handlePredict = useCallback((vessel) => {
    const id = vessel.id
    // Prevent duplicate in-flight requests
    setPredMap(prev => {
      if (prev[id]?.loading) return prev
      return { ...prev, [id]: { loading: true, result: null, error: null } }
    })
    const req = buildPredictionRequest(vessel)
    predictionsApi.delay(req)
      .then(result => setPredMap(prev => ({ ...prev, [id]: { loading: false, result, error: null } })))
      .catch(err   => {
        const msg = err?.response?.data?.detail ?? err?.message ?? 'Prediction failed'
        setPredMap(prev => ({ ...prev, [id]: { loading: false, result: null, error: msg } }))
      })
  }, [])

  return (
    <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth:  660,
          animation: 'hero-enter 0.55s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {/* Eyebrow */}
        <p style={{
          fontSize:      11,
          fontWeight:    600,
          color:         'rgba(255,255,255,0.52)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom:  18,
        }}>
          Real-Time Insights. Smarter Decisions.
        </p>

        {/* Main heading */}
        <h1 style={{
          fontSize:     'clamp(42px, 3.6vw, 58px)',
          fontWeight:   800,
          lineHeight:   1.05,
          color:        '#ffffff',
          margin:        0,
          marginBottom:  20,
          textShadow:   '0 2px 24px rgba(0,0,0,0.45)',
          letterSpacing: '-0.01em',
        }}>
          AI-Powered<br/>
          Vessel Delay Prediction
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize:    16,
          color:       'rgba(255,255,255,0.78)',
          lineHeight:  1.6,
          marginBottom: 36,
          maxWidth:    520,
          textShadow:  '0 1px 8px rgba(0,0,0,0.35)',
        }}>
          Predict delays. Optimize operations. Keep global trade moving.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/vessels')}
            style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:            8,
              minWidth:       160,
              height:         52,
              paddingInline:  28,
              borderRadius:   14,
              border:         'none',
              cursor:         'pointer',
              fontFamily:     'inherit',
              fontSize:       15,
              fontWeight:     700,
              color:          '#020d1e',
              background:     'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
              boxShadow:      '0 0 22px rgba(6,214,199,0.45), 0 4px 16px rgba(0,0,0,0.25)',
              transition:     'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 0 32px rgba(6,214,199,0.65), 0 6px 20px rgba(0,0,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 0 22px rgba(6,214,199,0.45), 0 4px 16px rgba(0,0,0,0.25)'
            }}
          >
            Get Started
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            style={{
              display:          'inline-flex',
              alignItems:       'center',
              gap:               8,
              minWidth:          160,
              height:            52,
              paddingInline:     24,
              borderRadius:      14,
              border:            '1px solid rgba(255,255,255,0.22)',
              cursor:            'pointer',
              fontFamily:        'inherit',
              fontSize:          15,
              fontWeight:        600,
              color:             'rgba(255,255,255,0.85)',
              background:        'rgba(255,255,255,0.08)',
              backdropFilter:    'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow:         '0 4px 16px rgba(0,0,0,0.18)',
              transition:        'transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform  = 'translateY(-2px)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.13)'
              e.currentTarget.style.boxShadow  = '0 6px 20px rgba(0,0,0,0.25)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform  = 'translateY(0)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.boxShadow  = '0 4px 16px rgba(0,0,0,0.18)'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none"/>
            </svg>
            Watch Demo
          </button>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────────── */}
      <RouteEfficiency />

      {/* ── Fleet Risk Summary (derived from real predictions only) ──────────── */}
      {!loading && !apiError && vessels.length > 0 && (() => {
        const s = fleetSummary(vessels, predMap)
        return (
          <div style={{ animation: 'kpi-enter 0.45s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}>
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Fleet Risk Summary</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {s.analyzed} of {s.total} vessel{s.total !== 1 ? 's' : ''} analyzed
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {/* Total */}
              <div className="glass" style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{s.total}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monitored</p>
              </div>
              {/* Analyzed */}
              <div className="glass" style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#06d6c7', lineHeight: 1 }}>{s.analyzed}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Predicted</p>
              </div>
              {/* High risk */}
              <div className="glass" style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: s.high > 0 ? '#ef4444' : 'rgba(255,255,255,0.35)', lineHeight: 1 }}>{s.high}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>At Risk</p>
              </div>
              {/* Normal */}
              <div className="glass" style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: s.normal > 0 ? '#06d6c7' : 'rgba(255,255,255,0.35)', lineHeight: 1 }}>{s.normal}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Normal</p>
              </div>
              {/* Not analyzed */}
              <div className="glass" style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>{s.total - s.analyzed}</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Not Analyzed</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Two-column: vessel cards + route overview ─────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap:                 16,
        alignItems:          'start',
      }}>
        {/* Vessel list */}
        <div style={{ animation: 'kpi-enter 0.5s 0.25s cubic-bezier(0.22,1,0.36,1) both' }}>
          <SectionHeader title="Active Fleet" action="View All" />

          {/* Loading */}
          {loading && (
            <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(n => (
                <div key={n} className="glass" style={{
                  height: 88, borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  animation: 'hero-enter 0.4s ease both',
                }} />
              ))}
            </div>
          )}

          {/* API error */}
          {!loading && apiError && (
            <div className="glass-dark" style={{ padding: '16px 18px', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: 'rgba(239,68,68,0.85)', marginBottom: 4, fontWeight: 600 }}>
                Backend unavailable
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>
                {apiError}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !apiError && vessels.length === 0 && (
            <div className="glass-dark" style={{ padding: '20px 18px', borderRadius: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.52)' }}>No vessels in the database yet.</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>
                Add vessels via POST /api/vessels to see them here.
              </p>
            </div>
          )}

          {/* Vessel cards */}
          {!loading && !apiError && vessels.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vessels.slice(0, 6).map((v, i) => {
                const ps = predMap[v.id] ?? {}
                return (
                  <VesselCard
                    key={v.id}
                    vessel={v}
                    index={i}
                    onPredict={handlePredict}
                    prediction={ps.result ?? null}
                    predLoading={ps.loading ?? false}
                    predError={ps.error ?? null}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: route overview + priority vessels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RouteOverview />

          {/* Priority Attention — only shown when predictions exist */}
          {(() => {
            const pv = priorityVessels(vessels, predMap)
            return (
              <div className="glass-dark" style={{ padding: '18px 20px', animation: 'kpi-enter 0.5s 0.4s cubic-bezier(0.22,1,0.36,1) both' }}>
                <div style={{ marginBottom: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>Priority Attention</h2>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.05em' }}>ML-ranked</span>
                </div>

                {pv.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '12px 0' }}>
                    No vessels analyzed yet
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pv.map(({ vessel, pred }) => {
                      const score   = pred.congestion_risk_score
                      const label   = pred.congestion_risk_label
                      const flag    = pred.congestion_risk_flag
                      const pct     = Math.round(score * 100)
                      const color   = flag === 1 ? '#ef4444' : '#06d6c7'
                      const name    = vessel.vessel_name ?? vessel.name ?? `Vessel ${vessel.id}`
                      const dep     = vessel.departure_port_code ?? vessel.departurePort ?? '—'
                      const arr     = vessel.arrival_port_code   ?? vessel.arrivalPort   ?? '—'
                      const guidance = riskGuidance(label)
                      return (
                        <div key={vessel.id} style={{
                          padding: '10px 12px', borderRadius: 10,
                          background: flag === 1 ? 'rgba(239,68,68,0.08)' : 'rgba(6,214,199,0.06)',
                          border: `1px solid ${flag === 1 ? 'rgba(239,68,68,0.20)' : 'rgba(6,214,199,0.15)'}`,
                        }}>
                          {/* Name + score */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                              {name}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</span>
                          </div>
                          {/* Route */}
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', marginBottom: 6 }}>
                            {dep} → {arr}
                          </div>
                          {/* Risk label */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 700, color,
                              textTransform: 'uppercase', letterSpacing: '0.1em',
                              background: flag === 1 ? 'rgba(239,68,68,0.12)' : 'rgba(6,214,199,0.10)',
                              padding: '2px 6px', borderRadius: 4,
                            }}>
                              {label}
                            </span>
                          </div>
                          {/* Deterministic guidance — NOT ML output */}
                          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', lineHeight: 1.4, margin: 0 }}>
                            {guidance}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

    </div>
  )
}
