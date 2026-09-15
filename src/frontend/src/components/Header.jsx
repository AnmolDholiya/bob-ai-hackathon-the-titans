import { useLocation } from 'react-router-dom'

const titles = {
  '/': 'Dashboard',
  '/ports': 'Ports',
  '/vessels': 'Vessels',
  '/predictions': 'Predictions',
  '/optimizer': 'Optimizer',
  '/schedule': '72-Hour Schedule',
}

export default function Header() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Port Operations'

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
    </header>
  )
}
