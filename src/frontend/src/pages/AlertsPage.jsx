import { useState } from 'react'
import { SectionHeader, StatusBadge } from '../components/GlassUI'
import { ALERTS } from '../data/mockData'

const CATEGORIES = ['All', 'Critical', 'High', 'Medium', 'Informational']
const ALERT_STATUS = ['All', 'Active', 'Acknowledged', 'Resolved']

const SEV_ICON = {
  Critical:      { color: '#ef4444', icon: '⬛' },
  High:          { color: '#f97316', icon: '⬛' },
  Medium:        { color: '#f59e0b', icon: '⬛' },
  Informational: { color: '#3b82f6', icon: '⬛' },
}

export default function AlertsPage() {
  const [sevFilter, setSevFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = ALERTS.filter(a => {
    const mS = sevFilter === 'All' || a.severity === sevFilter
    const mSt = statusFilter === 'All' || a.status === statusFilter
    return mS && mSt
  })

  const counts = CATEGORIES.slice(1).reduce((acc, sev) => {
    acc[sev] = ALERTS.filter(a => a.severity === sev && a.status === 'Active').length
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader title="Alerts" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORIES.slice(1).map(sev => (
          <button
            key={sev}
            onClick={() => setSevFilter(sev === sevFilter ? 'All' : sev)}
            className={`glass p-4 text-left transition-all hover:scale-[1.02] ${sevFilter === sev ? 'ring-1 ring-cyan-400/50' : ''}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ background: SEV_ICON[sev]?.color }} />
              <span className="text-xs text-white/50">{sev}</span>
            </div>
            <p className="text-2xl font-bold text-white">{counts[sev] ?? 0}</p>
            <p className="text-xs text-white/30 mt-0.5">Active</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass p-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs text-white/40 mr-1">Severity:</span>
        {CATEGORIES.map(s => (
          <button
            key={s}
            onClick={() => setSevFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sevFilter === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            {s}
          </button>
        ))}
        <span className="text-xs text-white/40 ml-4 mr-1">Status:</span>
        {ALERT_STATUS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-white/40">{filtered.length} alert{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="glass p-8 text-center text-white/40 text-sm">No alerts match the current filters.</div>
        )}
        {filtered.map(a => (
          <div key={a.id} className="glass p-4 hover:bg-white/5 transition-colors">
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: SEV_ICON[a.severity]?.color, marginTop: 5 }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{a.title}</span>
                  <StatusBadge value={a.severity} />
                  <StatusBadge value={a.status === 'Active' ? 'Active' : a.status} />
                </div>
                <p className="text-xs text-white/50 mb-2">{a.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-white/30">
                  {a.vessel && <span>Vessel: <span className="text-white/50">{a.vessel}</span></span>}
                  {a.port && <span>Port: <span className="text-white/50">{a.port}</span></span>}
                  <span>{a.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
