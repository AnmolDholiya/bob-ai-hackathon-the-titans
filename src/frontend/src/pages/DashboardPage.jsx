import { useEffect, useState } from 'react'
import { healthCheck } from '../services/api'

export default function DashboardPage() {
  const [apiStatus, setApiStatus] = useState('checking…')

  useEffect(() => {
    healthCheck()
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('unavailable'))
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Port Operations Control Center
        </h2>
        <p className="text-gray-500 text-sm">
          Container Congestion Predictor &amp; Port Operations Optimiser
        </p>
      </div>

      <div className="rounded-lg bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
          System Status
        </h3>
        <div className="flex items-center gap-3">
          <span
            className={[
              'h-2.5 w-2.5 rounded-full',
              apiStatus === 'connected' ? 'bg-green-500' : 'bg-gray-400',
            ].join(' ')}
          />
          <span className="text-sm text-gray-700">
            Backend API —{' '}
            <span
              className={
                apiStatus === 'connected' ? 'text-green-600 font-medium' : 'text-gray-500'
              }
            >
              {apiStatus}
            </span>
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">
          Phase 1 — Foundation complete. Features will appear here in subsequent phases.
        </p>
      </div>
    </div>
  )
}
