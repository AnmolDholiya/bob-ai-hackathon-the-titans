import { useState } from 'react'
import { SectionHeader, GlassCard, ProgressBar } from '../components/GlassUI'
import { ANALYTICS_KPIS, ARRIVAL_CHART_DATA, DELAY_TREND_DATA, PORT_UTIL_DATA, CONGESTION_DIST } from '../data/mockData'

// Simple inline bar chart using SVG
function BarChart({ data, xKey, yKey, color = '#06d6c7', height = 120 }) {
  const max = Math.max(...data.map(d => d[yKey]))
  const w = 100 / data.length
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      {data.map((d, i) => {
        const barH = max > 0 ? (d[yKey] / max) * (height - 20) : 0
        const x = i * w + w * 0.15
        const barW = w * 0.7
        return (
          <g key={i}>
            <rect
              x={x} y={height - 20 - barH}
              width={barW} height={barH}
              fill={color} opacity="0.8" rx="1"
            />
            <text x={x + barW / 2} y={height - 4} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.4)">
              {d[xKey]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function LineChart({ data, xKey, yKey, color = '#06d6c7', height = 120 }) {
  const max = Math.max(...data.map(d => d[yKey]))
  const min = Math.min(...data.map(d => d[yKey]))
  const range = max - min || 1
  const n = data.length
  const pts = data.map((d, i) => {
    const x = (i / (n - 1)) * 90 + 5
    const y = height - 20 - ((d[yKey] - min) / range) * (height - 30)
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const [x, y] = pts[i].split(',').map(Number)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="2" fill={color} />
            <text x={(i / (n - 1)) * 90 + 5} y={height - 4} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.4)">{d[xKey]}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ data, size = 80 }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  let offset = 0
  const r = 28, cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const pct = d.value / total
        const dash = pct * circ
        const gap = circ - dash
        const seg = (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color} strokeWidth="8"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )
        offset += pct
        return seg
      })}
      <circle cx={cx} cy={cy} r="20" fill="rgba(2,13,30,0.8)" />
      <text x={cx} y={cy + 1} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
        {data[0]?.value}%
      </text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.4)">Low</text>
    </svg>
  )
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState('arrivals')
  const tabs = [
    { id: 'arrivals', label: 'Vessel Arrivals' },
    { id: 'delay',    label: 'Delay Trend' },
    { id: 'port',     label: 'Port Utilization' },
    { id: 'risk',     label: 'Congestion Risk' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader title="Analytics" />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ANALYTICS_KPIS.map(k => (
          <div key={k.label} className="glass p-4">
            <p className="text-xs text-white/40 mb-1">{k.label}</p>
            <p className="text-2xl font-bold text-white">{k.value}</p>
            <p className={`text-xs font-semibold mt-1 ${k.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {k.trend} vs last month
            </p>
          </div>
        ))}
      </div>

      {/* Chart tabs */}
      <div className="glass overflow-hidden">
        <div className="flex border-b border-white/10">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/50 hover:text-white/80'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'arrivals' && (
            <div>
              <p className="text-xs text-white/40 mb-4">Monthly vessel arrivals — 2025</p>
              <BarChart data={ARRIVAL_CHART_DATA} xKey="month" yKey="arrivals" />
            </div>
          )}
          {tab === 'delay' && (
            <div>
              <p className="text-xs text-white/40 mb-4">Average vessel delay (days) — 2025</p>
              <LineChart data={DELAY_TREND_DATA} xKey="month" yKey="delay" color="#f59e0b" />
            </div>
          )}
          {tab === 'port' && (
            <div>
              <p className="text-xs text-white/40 mb-4">Port cargo utilization (%)</p>
              <BarChart data={PORT_UTIL_DATA} xKey="port" yKey="util" height={140} />
            </div>
          )}
          {tab === 'risk' && (
            <div className="flex items-center gap-8">
              <DonutChart data={CONGESTION_DIST} size={100} />
              <div className="space-y-3">
                {CONGESTION_DIST.map(d => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm text-white/70">{d.label}</span>
                    <span className="text-sm font-semibold text-white ml-auto">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: 'Top Delayed Route', value: 'Rotterdam → Oslo', sub: 'Avg +2.1 days', color: 'text-red-400' },
          { title: 'Busiest Port',      value: 'Singapore (SGSIN)', sub: '72% utilization', color: 'text-cyan-400' },
          { title: 'Most Reliable',     value: 'Valencia → Marseille', sub: '89% on-time', color: 'text-emerald-400' },
        ].map(c => (
          <div key={c.title} className="glass p-5">
            <p className="text-xs text-white/40 mb-1">{c.title}</p>
            <p className={`text-base font-semibold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-white/40 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
