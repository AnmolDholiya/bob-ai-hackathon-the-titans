import { useState } from 'react'
import { HEADER_H, HEADER_TOP } from '../layouts/AppLayout'

// ── Icon atoms ────────────────────────────────────────────────────────────────
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    style={{ width: 12, height: 12, opacity: 0.55 }}>
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── TopBar ────────────────────────────────────────────────────────────────────
export default function TopBar({ onMenuToggle }) {
  const [search, setSearch] = useState('')

  return (
    <header
      style={{
        position: 'fixed',
        top:   HEADER_TOP,
        left:  24,
        right: 24,
        height: HEADER_H,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        paddingLeft:  12,
        paddingRight: 12,
        /* No heavy outer bar — controls float individually over the video */
        background:    'transparent',
        backdropFilter: 'none',
        border:        'none',
        borderRadius:  0,
        boxShadow:     'none',
      }}
    >
      {/* ── Mobile menu button (hidden on desktop) ── */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden"
        style={{ color: 'rgba(255,255,255,0.6)', padding: 4, marginRight: 4, flexShrink: 0 }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
        </svg>
      </button>

      {/* ── Logo ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        height: 52, paddingInline: 14, borderRadius: 14,
        background: 'rgba(8,28,60,0.52)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.13)',
      }}>
        {/* Cyan wave mark */}
        <div style={{
          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
          background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px rgba(6,214,199,0.45)',
        }}>
          {/* Wave/ship mark */}
          <svg viewBox="0 0 24 24" fill="none" style={{ width: 18, height: 18 }}>
            <path d="M3 16 Q7 10 12 13 Q17 16 21 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M3 19 Q7 13 12 16 Q17 19 21 13" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>PORTMIND</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', marginTop: 2, letterSpacing: '0.03em' }}>
            Smarter Ports. On Time.
          </div>
        </div>
      </div>

      {/* ── Search bar — takes up center space ── */}
      <div style={{ flex: 1, maxWidth: 540, margin: '0 auto', position: 'relative' }}>
        <svg
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                   width: 17, height: 17, color: 'rgba(255,255,255,0.38)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Search vessel, port, or voyage..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            height: 46,
            paddingLeft: 44,
            paddingRight: 20,
            background:    'rgba(255,255,255,0.10)',
            border:        '1px solid rgba(255,255,255,0.20)',
            borderRadius:  14,
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(6,214,199,0.5)'
            e.target.style.boxShadow   = '0 0 0 3px rgba(6,214,199,0.08)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.20)'
            e.target.style.boxShadow   = 'none'
          }}
        />
      </div>

      {/* ── Right controls ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto',
        height: 52, paddingInline: 8, borderRadius: 14,
        background: 'rgba(8,28,60,0.40)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.10)',
      }}>

        {/* Global */}
        <button className="hdr-ctrl" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#06d6c7" strokeWidth="1.8"
            style={{ width: 16, height: 16, flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>Global</span>
          <ChevronDown />
        </button>

        {/* Last 7 days */}
        <button className="hdr-ctrl hidden-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#06d6c7" strokeWidth="1.8"
            style={{ width: 16, height: 16, flexShrink: 0 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>Last 7 days</span>
          <ChevronDown />
        </button>

        {/* Notifications */}
        <button className="hdr-ctrl" style={{
          position: 'relative', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8"
            style={{ width: 18, height: 18 }}>
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {/* Cyan notification dot */}
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 8, height: 8, borderRadius: '50%',
            background: '#06d6c7',
            boxShadow: '0 0 6px rgba(6,214,199,0.8)',
            border: '1.5px solid rgba(8,28,60,0.7)',
          }}/>
        </button>

        {/* Profile */}
        <button className="hdr-ctrl" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(6,214,199,0.18)',
            border: '1.5px solid rgba(6,214,199,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#06d6c7" strokeWidth="1.8"
              style={{ width: 14, height: 14 }}>
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Port Operator</span>
          <ChevronDown />
        </button>
      </div>
    </header>
  )
}
