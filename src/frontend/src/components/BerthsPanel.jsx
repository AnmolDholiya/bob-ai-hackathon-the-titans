import { useState } from 'react'
import { Btn, ErrorAlert, Field, Input, Modal, Select, StatusBadge, ConfirmModal, extractError } from './ui'

const EMPTY = {
  berth_code: '', capacity_tons: '', max_vessel_length_m: '',
  max_vessel_draft_m: '', status: 'operational',
  available_from: '', available_until: '',
}

function toNum(v) { const n = parseFloat(v); return isNaN(n) ? undefined : n }

function toBody(f, portId) {
  return {
    port_id: portId,
    berth_code: f.berth_code.trim(),
    capacity_tons: toNum(f.capacity_tons) ?? 0,
    max_vessel_length_m: toNum(f.max_vessel_length_m) ?? null,
    max_vessel_draft_m: toNum(f.max_vessel_draft_m) ?? null,
    status: f.status,
    available_from: f.available_from || null,
    available_until: f.available_until || null,
  }
}

function BerthForm({ initial, portId, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? {
      berth_code: initial.berth_code,
      capacity_tons: String(initial.capacity_tons),
      max_vessel_length_m: initial.max_vessel_length_m != null ? String(initial.max_vessel_length_m) : '',
      max_vessel_draft_m: initial.max_vessel_draft_m != null ? String(initial.max_vessel_draft_m) : '',
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
    <Modal title={initial ? 'Edit Berth' : 'Add Berth'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Berth Code *">
            <Input required value={form.berth_code} onChange={e => set('berth_code', e.target.value)} placeholder="e.g. B-01" />
          </Field>
          <Field label="Capacity (tons)">
            <Input type="number" min="0" step="any" value={form.capacity_tons} onChange={e => set('capacity_tons', e.target.value)} />
          </Field>
          <Field label="Max Vessel Length (m)">
            <Input type="number" min="0" step="any" value={form.max_vessel_length_m} onChange={e => set('max_vessel_length_m', e.target.value)} />
          </Field>
          <Field label="Max Vessel Draft (m)">
            <Input type="number" min="0" step="any" value={form.max_vessel_draft_m} onChange={e => set('max_vessel_draft_m', e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="operational">Operational</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
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
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Berth'}</Btn>
        </div>
      </form>
    </Modal>
  )
}

export default function BerthsPanel({ portId, berths, berth_api, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [error, setError] = useState(null)

  async function handleSave(body) {
    if (editing) await berth_api.update(editing.id, body)
    else await berth_api.create(body)
    setShowForm(false); setEditing(null)
    onRefresh()
  }

  async function handleDelete(id) {
    try { await berth_api.delete(id); onRefresh() }
    catch (err) { setError(extractError(err)) }
    finally { setConfirm(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">Berths ({berths.length})</h4>
        <Btn variant="secondary" onClick={() => { setEditing(null); setShowForm(true) }}>+ Add Berth</Btn>
      </div>
      <ErrorAlert message={error} onDismiss={() => setError(null)} />
      {berths.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">No berths defined.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500">
              <th className="text-left py-1 pr-3">Code</th>
              <th className="text-right py-1 pr-3">Capacity (t)</th>
              <th className="text-left py-1 pr-3">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {berths.map(b => (
              <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-1.5 pr-3 font-medium">{b.berth_code}</td>
                <td className="py-1.5 pr-3 text-right">{b.capacity_tons.toLocaleString()}</td>
                <td className="py-1.5 pr-3"><StatusBadge value={b.status} /></td>
                <td className="py-1.5 text-right space-x-2">
                  <Btn variant="ghost" onClick={() => { setEditing(b); setShowForm(true) }}>Edit</Btn>
                  <Btn variant="ghost" className="text-red-500" onClick={() => setConfirm(b.id)}>Del</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showForm && (
        <BerthForm
          initial={editing}
          portId={portId}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
      {confirm !== null && (
        <ConfirmModal
          message="Delete this berth? All cranes assigned to it will be unassigned."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
