import { useState } from 'react'
import { GlassCard, StatusBadge, RiskBadge, DataTable, Modal, SearchInput, SelectFilter, SectionHeader } from '../components/GlassUI'
import { VESSELS } from '../data/mockData'

function VesselDetailModal({ vessel, onClose }) {
  const delay = vessel.delay > 0 ? `+${vessel.delay} day${vessel.delay > 1 ? 's' : ''}` : 'None'
  return (
    <Modal title={vessel.name} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <StatusBadge value={vessel.status} size="md" />
          <span className="text-white/50 text-sm">IMO: {vessel.imo}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            ['Current Location', vessel.currentLocation],
            ['Speed', `${vessel.speed} knots`],
            ['Departure Port', vessel.departurePort],
            ['Arrival Port', vessel.arrivalPort],
            ['ETA', vessel.eta],
            ['Scheduled ETA', vessel.scheduledEta],
            ['Delay', delay],
            ['Congestion Risk', vessel.congestionRisk],
          ].map(([label, val]) => (
            <div key={label} className="glass p-3">
              <p className="text-xs text-white/40 mb-1">{label}</p>
              <p className="text-sm font-semibold text-white">{val}</p>
            </div>
          ))}
        </div>

        <div className="glass p-4">
          <p className="text-xs text-white/40 mb-2">Congestion Risk Indicator</p>
          <div className="flex items-center gap-4">
            <RiskBadge value={vessel.congestionRisk} />
            <div className="flex-1">
              {['Low','Medium','High'].map(level => (
                <div key={level} className="flex items-center gap-2 text-xs text-white/50 mb-1">
                  <span className={`w-2 h-2 rounded-full ${vessel.congestionRisk === level ? 'bg-cyan-400' : 'bg-white/10'}`} />
                  {level}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function VesselsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [portFilter, setPortFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const statuses = [...new Set(VESSELS.map(v => v.status))]
  const ports = [...new Set(VESSELS.flatMap(v => [v.departurePort, v.arrivalPort]))]

  const filtered = VESSELS.filter(v => {
    const q = search.toLowerCase()
    const matchQ = !q || v.name.toLowerCase().includes(q) || v.imo.includes(q) || v.currentLocation.toLowerCase().includes(q)
    const matchS = !statusFilter || v.status === statusFilter
    const matchP = !portFilter || v.arrivalPort === portFilter || v.departurePort === portFilter
    return matchQ && matchS && matchP
  })

  const columns = [
    { key: 'name',            label: 'Vessel',           render: (v, row) => <span className="font-semibold text-white">{v}</span> },
    { key: 'imo',             label: 'IMO',              render: v => <span className="font-mono text-white/60 text-xs">{v}</span> },
    { key: 'status',          label: 'Status',           render: v => <StatusBadge value={v} /> },
    { key: 'currentLocation', label: 'Current Location', render: v => <span className="text-white/70 text-xs">{v}</span> },
    { key: 'arrivalPort',     label: 'Arrival Port',     render: v => <span className="font-mono text-xs text-white/70">{v}</span> },
    { key: 'eta',             label: 'ETA',              render: v => <span className="text-xs text-white/70">{v}</span> },
    {
      key: 'delay',           label: 'Delay',
      render: v => <span className={`text-xs font-semibold ${v > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{v > 0 ? `+${v}d` : 'On Time'}</span>
    },
    { key: 'congestionRisk',  label: 'Congestion Risk',  render: v => <RiskBadge value={v} /> },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader title="Vessel Operations" />

      {/* Filters */}
      <div className="glass p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchInput placeholder="Search vessel, IMO, location…" value={search} onChange={setSearch} />
        </div>
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={statuses} placeholder="All Statuses" />
        <SelectFilter value={portFilter} onChange={setPortFilter} options={ports} placeholder="All Ports" />
        <span className="text-xs text-white/40">{filtered.length} vessels</span>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <DataTable columns={columns} rows={filtered} onRowClick={setSelected} />
        {filtered.length === 0 && (
          <p className="text-center text-white/40 text-sm py-10">No vessels match your filters.</p>
        )}
      </div>

      {selected && <VesselDetailModal vessel={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
