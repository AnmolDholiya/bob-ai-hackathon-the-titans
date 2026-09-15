import { SectionHeader } from '../components/GlassUI'
import { REPORTS } from '../data/mockData'

const TYPE_COLORS = {
  Port:   'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  Vessel: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Risk:   'bg-red-500/20 text-red-300 border border-red-500/30',
  Ops:    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
}

const TYPE_ICON_PATH = {
  Port:   'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20',
  Vessel: 'M3 17l9 3 9-3M12 2v15M5 10l7-2 7 2',
  Risk:   'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  Ops:    'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
}

export default function ReportsPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader title="Reports" />

      {/* Date range / type controls (placeholder UI) */}
      <div className="glass p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-cyan-400">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>
          </svg>
          <span>Jun 2025</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70">
          <span>All Types</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 opacity-50"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <button className="btn-cyan ml-auto text-xs py-2 px-4">Generate Report</button>
      </div>

      {/* Report cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.id} className="glass p-5 hover:scale-[1.01] transition-transform">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center" style={{ background: 'rgba(6,214,199,0.12)', border: '1px solid rgba(6,214,199,0.2)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#06d6c7" strokeWidth="1.8" className="w-5 h-5">
                  <path d={TYPE_ICON_PATH[r.type]} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-white text-sm">{r.title}</h3>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[r.type]}`}>{r.type}</span>
                </div>
                <p className="text-xs text-white/50 mb-3">{r.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">Period: <span className="text-white/50">{r.period}</span></span>
                  <div className="ml-auto flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors">
                      Preview
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors">
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent exports placeholder */}
      <div className="glass p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Recent Exports</h3>
        <div className="space-y-2">
          {['Port Performance — May 2025', 'Vessel Delay — May 2025', 'Operations — Apr 2025'].map((name, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(6,214,199,0.6)" strokeWidth="1.8" className="w-4 h-4">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6" strokeLinecap="round"/>
                </svg>
                <span className="text-sm text-white/70">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/30">PDF · {(Math.random() * 2 + 0.5).toFixed(1)} MB</span>
                <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
