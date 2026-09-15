// ─────────────────────────────────────────────────────────────────────────────
// RouteOverview — animated route efficiency bars
// ─────────────────────────────────────────────────────────────────────────────
import { SectionHeader } from './GlassUI'
import { ROUTE_EFFICIENCY } from '../data/mockData'

export default function RouteOverview() {
  return (
    <div
      className="glass-dark"
      style={{ padding: '18px 20px', animation: 'kpi-enter 0.5s 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
    >
      <SectionHeader title="Route Efficiency" action="View All" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ROUTE_EFFICIENCY.map(({ route, pct }, i) => (
          <div key={route} style={{ animation: `vessel-travel 0.4s ${0.1 * i}s ease both` }}>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'baseline',
              marginBottom:    6,
            }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
                {route}
              </span>
              <span style={{
                fontSize:   12,
                fontWeight: 700,
                color: pct >= 85 ? '#06d6c7' : pct >= 75 ? '#f59e0b' : '#ef4444',
              }}>
                {pct}%
              </span>
            </div>

            {/* Progress bar with CSS animation */}
            <div style={{
              height:       6,
              borderRadius: 3,
              background:   'rgba(255,255,255,0.08)',
              overflow:     'hidden',
              animation:    `route-pulse 3s ${0.8 + i * 0.4}s ease-in-out infinite`,
            }}>
              <div style={{
                height:       '100%',
                width:        `${pct}%`,
                borderRadius: 3,
                background:   pct >= 85
                  ? 'linear-gradient(90deg, #06d6c7, #0891b2)'
                  : pct >= 75
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #ef4444, #dc2626)',
                animation:    `bar-grow 0.7s ${0.2 + i * 0.12}s cubic-bezier(0.22,1,0.36,1) both`,
                '--bar-w':    `${pct}%`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
