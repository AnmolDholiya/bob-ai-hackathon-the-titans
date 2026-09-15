import { useState } from 'react'
import { Btn, ErrorAlert, Field, Input, Modal, Select, StatusBadge, ConfirmModal, extractError } from './ui'

const EMPTY = {
  crane_code: '', berth_id: '',
  loading_rate_tons_per_hour: '', unloading_rate_tons_per_hour: '',
  status: 'operational', available_from: '', available_until: '',
}

function toNum(v) { const n = parseFloat(v); return isNaN(n) ? undefined : n }

function toBody(f, portId) {
  return {
    port_id: portId,
    crane_code: f.crane_code.trim(),
    berth_id: f.berth_id ? parseInt(f.berth_id) : null,
    loading_rate_tons_per_hour: toNum(f.loading_rate_tons_per_hour),
    unloading_rate_tons_per_hour: toNum(f.unloading_rate_tons_per_hour),
    status: f.status,
    available_from: f.available_from || null,
    available_until: f.available_until || null,
  }
}

function CraneForm({ initial, portId, berths, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? {
      crane_code: initial.crane_code,
      berth_id: initial.berth_id != null ? String(initial.berth_id) : '',
      loading_rate_tons_per_hour: String(initial.loading_rate_tons_per_hour),
      unloading_rate_tons_per_hour: String(initial.unloading_rate_tons_per_hour),
      status: initial.status,
      available_from: initial.available_from?.slice(0, 16) ?? '',
      available_until: initial.available_until?.slice(0, 16) ?? '',
    } : { ...EMPTY }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError(null)
    try { await onSave(toBody(form, portId)) }
    catch (err) { setError(extractError(err)) }
    finally { setSaving(false) }
  }

  return (
    <Modal title={initial ? 'Edit Crane' : 'Add Crane'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Crane Code *">
            <Input required value={form.crane_code} onChange={e => set('crane_code', e.target.value)} placeholder="e.g. CR-01" />
          </Field>
          <Field label="Assigned Berth">
            <Select value={form.berth_id} onChange={e => set('berth_id', e.target.value)}>
              <option value="">— None —</option>
              {berths.map(b => <option key={b.id} value={b.id}>{b.berth_code}</option>)}
            </Select>
          </Field>
          <Field label="Loading Rate (t/h) *">
            <Input required type="number" min="0.01" step="any" value={form.loading_rate_tons_per_hour} onChange={e => set('loading_rate_tons_per_hour', e.target.value)} />
          </Field>
          <Field label="Unloading Rate (t/h) *">
            <Input required type="number" min="0.01" step="any" value={form.unloading_rate_tons_per_hour} onChange={e => set('unloading_rate_tons_per_hour', e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Available From">
            <Input type="datetime-local" value={form.available_from} onChange={e => set('available_from', e.target.value)} />
          </Field>
          <Field label="Available Until">
            <Input type="datetime-local" value={form.available_until} onChange={e => set('available_until', e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Crane'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

export default function CranesPanel({ portId, cranes, berths, cranes_api, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [error, setError] = useState(null)

  const berthMap = Object.fromEntries(berths.map(b => [b.id, b.berth_code]))

  async function handleSave(body) {
    if (editing) await cranes_api.update(editing.id, body)
    else await cranes_api.create(body)
    setShowForm(false); setEditing(null)
    onRefresh()
  }

  async function handleDelete(id) {
    try { await cranes_api.delete(id); onRefresh() }
    catch (err) { setError(extractError(err)) }
    finally { setConfirm(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Cranes ({cranes.length})</h4>
        <Btn variant="secondary" onClick={() => { setEditing(null); setShowForm(true) }}>+ Add Crane</Btn>
      </div>
      <ErrorAlert message={error} onDismiss={() => setError(null)} />
      {cranes.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No cranes defined.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500">
              <th className="text-left py-1 pr-3">Code</th>
              <th className="text-left py-1 pr-3">Berth</th>
              <th className="text-right py-1 pr-3">Load (t/h)</th>
              <th className="text-right py-1 pr-3">Unload (t/h)</th>
              <th className="text-left py-1 pr-3">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cranes.map(c => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-1.5 pr-3 font-medium">{c.crane_code}</td>
                <td className="py-1.5 pr-3 text-gray-500">{c.berth_id ? berthMap[c.berth_id] ?? '—' : '—'}</td>
                <td className="py-1.5 pr-3 text-right">{c.loading_rate_tons_per_hour}</td>
                <td className="py-1.5 pr-3 text-right">{c.unloading_rate_tons_per_hour}</td>
                <td className="py-1.5 pr-3"><StatusBadge value={c.status} /></td>
                <td className="py-1.5 text-right space-x-2">
                  <Btn variant="ghost" onClick={() => { setEditing(c); setShowForm(true) }}>Edit</Btn>
                  <Btn variant="ghost" className="text-red-500" onClick={() => setConfirm(c.id)}>Del</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <CraneForm
          initial={editing}
          portId={portId}
          berths={berths}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
      {confirm !== null && (
        <ConfirmModal
          message="Delete this crane?"
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
