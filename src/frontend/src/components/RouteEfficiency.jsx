// ─────────────────────────────────────────────────────────────────────────────
// RouteEfficiency — fleet-wide KPI summary strip (re-export as named section)
// ─────────────────────────────────────────────────────────────────────────────
import { SectionHeader, KPICard } from './GlassUI'
import { KPI_STATS } from '../data/mockData'

export default function RouteEfficiency() {
  return (
    <section style={{ animation: 'kpi-enter 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}>
      <SectionHeader title="Fleet Overview" />
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
        gap:                 12,
      }}>
        {KPI_STATS.map((kpi, i) => (
          <div key={kpi.id} style={{ animation: `kpi-enter 0.45s ${0.08 * i}s cubic-bezier(0.22,1,0.36,1) both` }}>
            <KPICard label={kpi.label} value={kpi.value} icon={kpi.icon} />
          </div>
        ))}
      </div>
    </section>
  )
}
