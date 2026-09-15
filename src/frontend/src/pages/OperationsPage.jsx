// ─────────────────────────────────────────────────────────────────────────────
// OperationsPage — 72-Hour Port Operations Dashboard
// Connects to real backend operations engine (ML-driven berth/crane/routing)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { SectionHeader } from '../components/GlassUI'
import { operationsApi } from '../services/api'

// ── Tiny helpers ──────────────────────────────────────────────────────────────
function riskColor(risk) {
  if (risk === 'High')    return '#ef4444'
  if (risk === 'Medium')  return '#f59e0b'
  if (risk === 'Low')     return '#06d6c7'
  return 'rgba(255,255,255,0.4)'
}
function riskBg(risk) {
  if (risk === 'High')    return 'rgba(239,68,68,0.10)'
  if (risk === 'Medium')  return 'rgba(245,158,11,0.10)'
  if (risk === 'Low')     return 'rgba(6,214,199,0.08)'
  return 'rgba(255,255,255,0.04)'
}
function riskBorder(risk) {
  if (risk === 'High')    return 'rgba(239,68,68,0.22)'
  if (risk === 'Medium')  return 'rgba(245,158,11,0.22)'
  if (risk === 'Low')     return 'rgba(6,214,199,0.18)'
  return 'rgba(255,255,255,0.08)'
}

function useOpsData(fetcher) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetcher()
      .then(d  => { if (!cancelled) { setData(d);  setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(e?.response?.data?.detail ?? e?.message ?? 'Request failed'); setLoading(false) } })
    return () => { cancelled = true }
  }, [])
  return { data, loading, error }
}

function LoadingBlock() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[1,2,3].map(n => (
        <div key={n} className="glass" style={{ height: 72, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }} />
      ))}
    </div>
  )
}
function ErrorBlock({ msg }) {
  return (
    <div className="glass-dark" style={{ padding: '14px 16px', borderRadius: 10 }}>
      <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.85)', fontWeight: 600 }}>Backend unavailable</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{msg}</p>
    </div>
  )
}
function EmptyBlock({ msg }) {
  return (
    <div className="glass-dark" style={{ padding: '14px 16px', borderRadius: 10, textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>{msg}</p>
    </div>
  )
}

// ── Route Recommendations ────────────────────────────────────────────────────
function RoutesSection() {
  const { data, loading, error } = useOpsData(operationsApi.routes)
  return (
    <section style={{ animation: 'kpi-enter 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
      <SectionHeader title="Alternate Route Recommendations" />
      {loading && <LoadingBlock />}
      {error   && <ErrorBlock msg={error} />}
      {!loading && !error && (!data || data.length === 0) && <EmptyBlock msg="No vessels to route." />}
      {!loading && !error && data && data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map(r => (
            <div key={r.vessel_id} style={{
              padding: '12px 16px', borderRadius: 10,
              background: riskBg(r.congestion_risk),
              border: `1px solid ${riskBorder(r.congestion_risk)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.vessel_name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(r.congestion_risk) }}>
                  {r.congestion_risk}{r.congestion_probability != null ? ` · ${Math.round(r.congestion_probability*100)}%` : ''}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', marginBottom: 5 }}>{r.current_route}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: riskColor(r.congestion_risk),
                  background: riskBg(r.congestion_risk), border: `1px solid ${riskBorder(r.congestion_risk)}`,
                  padding: '2px 7px', borderRadius: 4,
                }}>
                  {r.recommended_strategy.replace(/_/g, ' ')}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.48)', lineHeight: 1.5, margin: 0 }}>{r.reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Berth Assignments ────────────────────────────────────────────────────────
function BerthsSection() {
  const { data, loading, error } = useOpsData(operationsApi.berths)
  return (
    <section style={{ animation: 'kpi-enter 0.5s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}>
      <SectionHeader title="Berth Assignment" />
      {loading && <LoadingBlock />}
      {error   && <ErrorBlock msg={error} />}
      {!loading && !error && (!data || data.length === 0) && <EmptyBlock msg="No vessels to assign." />}
      {!loading && !error && data && data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map(a => (
            <div key={a.vessel_id} style={{
              padding: '12px 16px', borderRadius: 10,
              background: riskBg(a.priority), border: `1px solid ${riskBorder(a.priority)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{a.vessel_name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: riskColor(a.priority), textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {a.priority}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 5 }}>
                <div>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Berth</p>
                  <p style={{ fontSize: 12, color: '#06d6c7', fontWeight: 600 }}>{a.berth_code ?? 'Unassigned'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Window</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>{a.time_window}</p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5, margin: 0 }}>{a.reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Crane Assignments ─────────────────────────────────────────────────────────
function CranesSection() {
  const { data, loading, error } = useOpsData(operationsApi.cranes)
  return (
    <section style={{ animation: 'kpi-enter 0.5s 0.3s cubic-bezier(0.22,1,0.36,1) both' }}>
      <SectionHeader title="Crane Allocation" />
      {loading && <LoadingBlock />}
      {error   && <ErrorBlock msg={error} />}
      {!loading && !error && (!data || data.length === 0) && <EmptyBlock msg="No vessels to assign cranes." />}
      {!loading && !error && data && data.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map(a => (
            <div key={a.vessel_id} style={{
              padding: '12px 16px', borderRadius: 10,
              background: riskBg(a.priority), border: `1px solid ${riskBorder(a.priority)}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{a.vessel_name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: a.status === 'assigned' ? '#06d6c7' : '#ef4444', textTransform: 'uppercase' }}>
                  {a.status}
                </span>
              </div>
              {a.cranes.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 5 }}>
                  {a.cranes.map(c => (
                    <span key={c.crane_id} style={{
                      fontSize: 11, color: '#06d6c7', fontWeight: 600,
                      background: 'rgba(6,214,199,0.10)', border: '1px solid rgba(6,214,199,0.22)',
                      padding: '2px 8px', borderRadius: 5,
                    }}>
                      {c.crane_code} · {c.unloading_rate}t/h
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: 'rgba(239,68,68,0.70)', marginBottom: 5 }}>No cranes available</p>
              )}
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', lineHeight: 1.5, margin: 0 }}>{a.reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── 72-Hour Plan ──────────────────────────────────────────────────────────────
function PlanSection() {
  const { data, loading, error } = useOpsData(operationsApi.plan)
  return (
    <section style={{ animation: 'kpi-enter 0.5s 0.15s cubic-bezier(0.22,1,0.36,1) both' }}>
      <SectionHeader title="72-Hour Operations Plan" />
      {loading && <LoadingBlock />}
      {error   && <ErrorBlock msg={error} />}
      {!loading && !error && data?.note && <EmptyBlock msg={data.note} />}
      {!loading && !error && data?.windows && data.windows.map(w => (
        <div key={w.window} style={{ marginBottom: 18 }}>
          {/* Window header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#06d6c7',
              background: 'rgba(6,214,199,0.10)', border: '1px solid rgba(6,214,199,0.22)',
              padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              {w.window}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)' }}>
              {w.vessel_count} vessel{w.vessel_count !== 1 ? 's' : ''}
            </span>
          </div>

          {w.vessels.length === 0 ? (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', paddingLeft: 2 }}>No vessels in this window.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {w.vessels.map(v => (
                <div key={v.vessel_id} style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: riskBg(v.congestion_risk), border: `1px solid ${riskBorder(v.congestion_risk)}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{v.vessel_name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(v.congestion_risk) }}>
                      {v.congestion_risk}{v.congestion_probability != null ? ` · ${Math.round(v.congestion_probability*100)}%` : ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{v.route}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {[
                      ['Berth', v.berth_action],
                      ['Crane', v.crane_action],
                      ['Routing', v.routing_recommendation],
                    ].map(([label, val]) => (
                      <div key={label}>
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</p>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OperationsPage() {
  return (
    <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page title */}
      <div style={{ animation: 'hero-enter 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
          Operational Intelligence
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 2.8vw, 38px)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.1 }}>
          Port Operations Control
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 8, lineHeight: 1.6, maxWidth: 560 }}>
          Real-time operational decisions driven by the XGBoost + LightGBM congestion prediction ensemble.
        </p>
      </div>

      {/* 72-hour plan — full width */}
      <PlanSection />

      {/* Two-column: routes + berths */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
        <RoutesSection />
        <BerthsSection />
      </div>

      {/* Crane allocation — full width */}
      <CranesSection />
    </div>
  )
}
