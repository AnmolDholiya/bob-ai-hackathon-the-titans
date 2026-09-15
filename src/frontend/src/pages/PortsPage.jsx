import { useState } from 'react'
import { StatusBadge, ProgressBar, Modal, SectionHeader, SearchInput, SelectFilter } from '../components/GlassUI'
import { PORTS } from '../data/mockData'

function PortDetailModal({ port, onClose }) {
  const cargoUtil = port.maxCapacity > 0 ? ((port.currentCargo / port.maxCapacity) * 100).toFixed(1) : 0
  const yardUtil  = port.yardCapacity > 0 ? ((port.yardLoad / port.yardCapacity) * 100).toFixed(1) : 0

  return (
    <Modal title={`${port.name} — ${port.code}`} onClose={onClose} wide>
      <div className="space-y-4">
        <StatusBadge value={port.status} size="md" />

        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-3 space-y-2">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wide">Cargo Capacity</p>
            <p className="text-xs text-white/60">Max: <span className="text-white font-semibold">{port.maxCapacity.toLocaleString()} t</span></p>
            <p className="text-xs text-white/60">Current: <span className="text-white font-semibold">{port.currentCargo.toLocaleString()} t</span></p>
            <p className="text-xs text-white/60">Available: <span className="text-cyan-400 font-semibold">{(port.maxCapacity - port.currentCargo).toLocaleString()} t</span></p>
            <ProgressBar value={port.currentCargo} max={port.maxCapacity} showLabel />
          </div>
          <div className="glass p-3 space-y-2">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wide">Yard Capacity</p>
            <p className="text-xs text-white/60">Max: <span className="text-white font-semibold">{port.yardCapacity.toLocaleString()} t</span></p>
            <p className="text-xs text-white/60">Current: <span className="text-white font-semibold">{port.yardLoad.toLocaleString()} t</span></p>
            <p className="text-xs text-white/60">Available: <span className="text-cyan-400 font-semibold">{(port.yardCapacity - port.yardLoad).toLocaleString()} t</span></p>
            <ProgressBar value={port.yardLoad} max={port.yardCapacity} showLabel />
          </div>
        </div>

        <div className="glass p-4">
          <p className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-3">Vessel Size Limits</p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {[['Max Length', `${port.maxVesselLength} m`], ['Max Draft', `${port.maxDraft} m`], ['Location', port.location]].map(([l, v]) => (
              <div key={l}><p className="text-xs text-white/40">{l}</p><p className="text-white font-medium">{v}</p></div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass p-4">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-2">Berths</p>
            <p className="text-2xl font-bold text-cyan-400">{port.availableBerths}<span className="text-sm text-white/40 font-normal"> / {port.totalBerths}</span></p>
            <p className="text-xs text-white/40 mt-1">Available</p>
          </div>
          <div className="glass p-4">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wide mb-2">Cranes</p>
            <p className="text-2xl font-bold text-cyan-400">{port.availableCranes}<span className="text-sm text-white/40 font-normal"> / {port.totalCranes}</span></p>
            <p className="text-xs text-white/40 mt-1">Available</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function PortCard({ port, onClick }) {
  const util = port.maxCapacity > 0 ? (port.currentCargo / port.maxCapacity) * 100 : 0
  const yardUtil = port.yardCapacity > 0 ? (port.yardLoad / port.yardCapacity) * 100 : 0

  return (
    <div
      className="glass p-5 cursor-pointer hover:scale-[1.01] transition-transform animate-fade-in"
      onClick={() => onClick(port)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-cyan-400 font-semibold">{port.code}</span>
            <StatusBadge value={port.status} />
          </div>
          <h3 className="font-semibold text-white">{port.name}</h3>
          <p className="text-xs text-white/40">{port.location}</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" className="w-5 h-5 mt-1">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="space-y-2 text-xs mb-4">
        <div>
          <div className="flex justify-between text-white/50 mb-1">
            <span>Cargo Utilization</span>
            <span className="text-white">{util.toFixed(1)}%</span>
          </div>
          <ProgressBar value={port.currentCargo} max={port.maxCapacity} />
        </div>
        <div>
          <div className="flex justify-between text-white/50 mb-1">
            <span>Yard Utilization</span>
            <span className="text-white">{yardUtil.toFixed(1)}%</span>
          </div>
          <ProgressBar value={port.yardLoad} max={port.yardCapacity} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
        <div>Berths: <span className="text-cyan-400 font-semibold">{port.availableBerths}/{port.totalBerths}</span></div>
        <div>Cranes: <span className="text-cyan-400 font-semibold">{port.availableCranes}/{port.totalCranes}</span></div>
      </div>
    </div>
  )
}

export default function PortsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const statuses = [...new Set(PORTS.map(p => p.status))]
  const filtered = PORTS.filter(p => {
    const q = search.toLowerCase()
    const mQ = !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
    const mS = !statusFilter || p.status === statusFilter
    return mQ && mS
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader title="Port Operations" action="View All" />

      <div className="glass p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchInput placeholder="Search port name, code, location…" value={search} onChange={setSearch} />
        </div>
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={statuses} placeholder="All Statuses" />
        <span className="text-xs text-white/40">{filtered.length} ports</span>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => <PortCard key={p.id} port={p} onClick={setSelected} />)}
        {filtered.length === 0 && (
          <p className="col-span-3 text-center text-white/40 text-sm py-10">No ports match your filters.</p>
        )}
      </div>

      {selected && <PortDetailModal port={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
