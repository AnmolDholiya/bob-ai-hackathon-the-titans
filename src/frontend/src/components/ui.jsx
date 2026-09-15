/** Inline API error message extractor */
export function extractError(err) {
  if (!err) return 'Unknown error'
  const d = err.response?.data
  if (!d) return err.message || 'Request failed'
  if (typeof d === 'string') return d
  if (d.detail) {
    if (typeof d.detail === 'string') return d.detail
    if (Array.isArray(d.detail)) return d.detail.map(e => e.msg || JSON.stringify(e)).join('; ')
  }
  return JSON.stringify(d)
}

/** Status badge colours */
export const STATUS_COLORS = {
  operational: 'bg-green-100 text-green-700',
  occupied:    'bg-yellow-100 text-yellow-700',
  maintenance: 'bg-red-100 text-red-700',
  offline:     'bg-gray-100 text-gray-600',
}

export function StatusBadge({ value }) {
  const cls = STATUS_COLORS[value] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {value}
    </span>
  )
}

export function ErrorAlert({ message, onDismiss }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600 font-bold leading-none">×</button>
      )}
    </div>
  )
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm space-y-4">
        <p className="text-sm text-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${props.className ?? ''}`}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${props.className ?? ''}`}
    >
      {children}
    </select>
  )
}

export function Btn({ variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center px-3 py-1.5 text-sm rounded font-medium transition-colors disabled:opacity-50'
  const variants = {
    primary:  'bg-blue-600 text-white hover:bg-blue-700',
    secondary:'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger:   'bg-red-600 text-white hover:bg-red-700',
    ghost:    'text-blue-600 hover:underline bg-transparent',
  }
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />
}

export function StatCard({ label, value, sub }) {
  return (
    <div className="rounded border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-800 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
