import { useState } from 'react'
import { Btn, ErrorAlert, Field, Input, Modal, extractError } from './ui'

const EMPTY = {
  port_code: '', port_name: '', location: '',
  max_daily_capacity_tons: '', current_cargo_tons: '',
  yard_capacity_tons: '', current_yard_load_tons: '',
  max_vessel_length_m: '', max_vessel_draft_m: '', max_vessel_weight_tons: '',
}

function toNum(v) {
  const n = parseFloat(v)
  return isNaN(n) ? undefined : n
}

function toBody(f) {
  return {
    port_code:               f.port_code.trim(),
    port_name:               f.port_name.trim(),
    location:                f.location.trim() || null,
    max_daily_capacity_tons: toNum(f.max_daily_capacity_tons) ?? 0,
    current_cargo_tons:      toNum(f.current_cargo_tons) ?? 0,
    yard_capacity_tons:      toNum(f.yard_capacity_tons) ?? 0,
    current_yard_load_tons:  toNum(f.current_yard_load_tons) ?? 0,
    max_vessel_length_m:     toNum(f.max_vessel_length_m) ?? null,
    max_vessel_draft_m:      toNum(f.max_vessel_draft_m) ?? null,
    max_vessel_weight_tons:  toNum(f.max_vessel_weight_tons) ?? null,
  }
}

export default function PortForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial
      ? {
          port_code: initial.port_code,
          port_name: initial.port_name,
          location: initial.location ?? '',
          max_daily_capacity_tons: String(initial.max_daily_capacity_tons),
          current_cargo_tons: String(initial.current_cargo_tons),
          yard_capacity_tons: String(initial.yard_capacity_tons),
          current_yard_load_tons: String(initial.current_yard_load_tons),
          max_vessel_length_m: initial.max_vessel_length_m != null ? String(initial.max_vessel_length_m) : '',
          max_vessel_draft_m: initial.max_vessel_draft_m != null ? String(initial.max_vessel_draft_m) : '',
          max_vessel_weight_tons: initial.max_vessel_weight_tons != null ? String(initial.max_vessel_weight_tons) : '',
        }
      : { ...EMPTY }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave(toBody(form))
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={initial ? 'Edit Port' : 'Add Port'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Port Code *">
            <Input required value={form.port_code} onChange={e => set('port_code', e.target.value)} placeholder="e.g. SGSIN" />
          </Field>
          <Field label="Port Name *">
            <Input required value={form.port_name} onChange={e => set('port_name', e.target.value)} placeholder="e.g. Port of Singapore" />
          </Field>
        </div>

        <Field label="Location">
          <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
        </Field>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Cargo Capacity</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max Daily Capacity (tons)">
              <Input type="number" min="0" step="any" value={form.max_daily_capacity_tons} onChange={e => set('max_daily_capacity_tons', e.target.value)} />
            </Field>
            <Field label="Current Cargo (tons)">
              <Input type="number" min="0" step="any" value={form.current_cargo_tons} onChange={e => set('current_cargo_tons', e.target.value)} />
            </Field>
            <Field label="Yard Capacity (tons)">
              <Input type="number" min="0" step="any" value={form.yard_capacity_tons} onChange={e => set('yard_capacity_tons', e.target.value)} />
            </Field>
            <Field label="Current Yard Load (tons)">
              <Input type="number" min="0" step="any" value={form.current_yard_load_tons} onChange={e => set('current_yard_load_tons', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Vessel Limits</p>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Max Length (m)">
              <Input type="number" min="0" step="any" value={form.max_vessel_length_m} onChange={e => set('max_vessel_length_m', e.target.value)} />
            </Field>
            <Field label="Max Draft (m)">
              <Input type="number" min="0" step="any" value={form.max_vessel_draft_m} onChange={e => set('max_vessel_draft_m', e.target.value)} />
            </Field>
            <Field label="Max Weight (tons)">
              <Input type="number" min="0" step="any" value={form.max_vessel_weight_tons} onChange={e => set('max_vessel_weight_tons', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn type="button" variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Port'}</Btn>
        </div>
      </form>
    </Modal>
  )
}
