import { useState } from 'react'
import { SectionHeader } from '../components/GlassUI'

function Section({ title, children }) {
  return (
    <div className="glass overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-white/80 font-medium">{label}</p>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      onClick={() => setOn(o => !o)}
      className={`relative w-10 h-5 rounded-full transition-colors ${on ? 'bg-cyan-500' : 'bg-white/20'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${on ? 'left-5' : 'left-0.5'}`} />
    </button>
  )
}

function TextInput({ defaultValue, placeholder }) {
  const [v, setV] = useState(defaultValue ?? '')
  return (
    <input
      value={v}
      onChange={e => setV(e.target.value)}
      placeholder={placeholder}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors w-56"
    />
  )
}

function SelectInput({ options, defaultValue }) {
  const [v, setV] = useState(defaultValue ?? options[0])
  return (
    <select
      value={v}
      onChange={e => setV(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-cyan-500/40 transition-colors"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <SectionHeader title="Settings" />

      <Section title="Profile">
        <SettingRow label="Display Name" description="Shown in the top navigation bar.">
          <TextInput defaultValue="Port Operator" />
        </SettingRow>
        <SettingRow label="Role">
          <SelectInput options={['Port Operator', 'Analyst', 'Manager', 'Admin']} defaultValue="Port Operator" />
        </SettingRow>
        <SettingRow label="Email">
          <TextInput defaultValue="operator@portmind.io" />
        </SettingRow>
      </Section>

      <Section title="Dashboard Preferences">
        <SettingRow label="Default View" description="Page shown after login.">
          <SelectInput options={['Home', 'Vessels', 'Ports', 'Analytics', 'Operations']} defaultValue="Home" />
        </SettingRow>
        <SettingRow label="Date Range" description="Default time window for charts.">
          <SelectInput options={['Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom']} defaultValue="Last 7 days" />
        </SettingRow>
        <SettingRow label="Show KPI cards" description="Display KPI summary on dashboard.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Show route map" description="Display live route overview.">
          <Toggle defaultOn={true} />
        </SettingRow>
      </Section>

      <Section title="Notification Preferences">
        <SettingRow label="Critical alerts" description="Immediate push notifications.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="High severity alerts">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Medium severity alerts">
          <Toggle defaultOn={false} />
        </SettingRow>
        <SettingRow label="Informational alerts">
          <Toggle defaultOn={false} />
        </SettingRow>
        <SettingRow label="Email digest" description="Daily summary sent to your email.">
          <Toggle defaultOn={true} />
        </SettingRow>
      </Section>

      <Section title="Display Settings">
        <SettingRow label="Theme" description="Interface colour scheme.">
          <SelectInput options={['Dark Maritime (default)', 'Dark', 'Light']} defaultValue="Dark Maritime (default)" />
        </SettingRow>
        <SettingRow label="Language">
          <SelectInput options={['English', 'Deutsch', 'Français', 'Español']} defaultValue="English" />
        </SettingRow>
        <SettingRow label="Timezone">
          <SelectInput options={['UTC', 'UTC+1', 'UTC+8', 'UTC-5']} defaultValue="UTC" />
        </SettingRow>
        <SettingRow label="Compact tables" description="Reduce row padding in data tables.">
          <Toggle defaultOn={false} />
        </SettingRow>
      </Section>

      <div className="flex justify-end gap-3 pb-4">
        <button className="btn-ghost text-sm">Reset to Defaults</button>
        <button className="btn-cyan text-sm">Save Changes</button>
      </div>
    </div>
  )
}
