import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import VideoBackground from '../components/VideoBackground'

// Header height + top offset used by both TopBar and the scroll-area padding
export const HEADER_H         = 72   // px — height of the floating header bar
export const HEADER_TOP       = 20   // px — gap from viewport top
export const SIDEBAR_COLLAPSED = 64  // px — sidebar collapsed (icon-only) width
export const SIDEBAR_L        = 18   // px — sidebar left offset

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#020d1e' }}>

      {/* ── Layer 0 + 1: video + cinematic overlay ── */}
      <VideoBackground />

      {/* ── Layer 2: floating UI ── */}

      {/* Fixed header */}
      <TopBar onMenuToggle={() => setSidebarOpen(o => !o)} />

      {/* Fixed sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Scrollable page content — padded to clear header + sidebar */}
      <main
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          paddingTop:  HEADER_TOP + HEADER_H + 16,
          paddingLeft: SIDEBAR_L + SIDEBAR_COLLAPSED + 14,
          paddingRight: 24,
          paddingBottom: 24,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </main>

      {/* Mobile sidebar overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 29, background: 'rgba(0,0,0,0.5)' }}
          className="lg:hidden"
        />
      )}
    </div>
  )
}
