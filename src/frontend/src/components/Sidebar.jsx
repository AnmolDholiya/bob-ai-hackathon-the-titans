<<<<<<< HEAD
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { HEADER_H, HEADER_TOP, SIDEBAR_L } from '../layouts/AppLayout'
=======
import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { HEADER_H, HEADER_TOP, SIDEBAR_L } from '../layouts/AppLayout'
import { useLanguage } from '../i18n/LanguageContext'
import { alertsApi } from '../services/api'
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)

// Collapsed width (icon only) / expanded width (hover)
const W_COLLAPSED = 64
const W_EXPANDED  = 148

// ── Nav definition ────────────────────────────────────────────────────────────
<<<<<<< HEAD
const NAV = [
  { to: '/',           label: 'Home',       icon: HomeIcon,     exact: true },
  { to: '/vessels',    label: 'Vessels',    icon: VesselIcon                },
  { to: '/ports',      label: 'Ports',      icon: AnchorIcon                },
  { to: '/analytics',  label: 'Analytics',  icon: ChartIcon                 },
  { to: '/operations', label: 'Operations', icon: OpsIcon                   },
  { to: '/alerts',     label: 'Alerts',     icon: AlertIcon,    badge: 3    },
  { to: '/reports',    label: 'Reports',    icon: ReportIcon                },
  { to: '/settings',   label: 'Settings',   icon: SettingsIcon              },
=======
const NAV_ITEMS = [
  { to: '/',           i18nKey: 'nav_home',       label: 'Home',        icon: HomeIcon,     exact: true },
  { to: '/vessels',    i18nKey: 'nav_vessels',    label: 'Vessels',     icon: VesselIcon                },
  { to: '/ports',      i18nKey: 'nav_ports',      label: 'Ports',       icon: AnchorIcon                },
  { to: '/analytics',  i18nKey: 'nav_analytics',  label: 'Analytics',   icon: ChartIcon                 },
  { to: '/operations', i18nKey: 'nav_operations', label: 'Operations',  icon: OpsIcon                   },
  { to: '/alerts',     i18nKey: 'nav_alerts',      label: 'Alerts',      icon: AlertIcon,    isAlert: true },
  { to: '/reports',    i18nKey: 'nav_reports',     label: 'Reports',     icon: ReportIcon                },
  { to: '/import',     i18nKey: 'nav_import',      label: 'Data Import', icon: ImportIcon                },
  { to: '/settings',   i18nKey: 'nav_settings',    label: 'Settings',    icon: SettingsIcon              },
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
]

// ── Icon components ───────────────────────────────────────────────────────────
function HomeIcon()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M3 12L12 4l9 8v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8z" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function VesselIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M3 17l9 3 9-3M12 2v15M5 10l7-2 7 2" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function AnchorIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><circle cx="12" cy="6" r="2"/><path d="M12 8v12M6 12H4a8 8 0 0016 0h-2M8 12h8" strokeLinecap="round"/></svg> }
function ChartIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg> }
function OpsIcon()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg> }
function AlertIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function ReportIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5" strokeLinecap="round"/></svg> }
function SettingsIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/></svg> }
<<<<<<< HEAD

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }) {
  const [hovered, setHovered] = useState(false)
=======
function ImportIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 18, height: 18, flexShrink: 0 }}><polyline points="16 16 12 12 8 16" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="12" x2="12" y2="21" strokeLinecap="round"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 104 16.3" strokeLinecap="round" strokeLinejoin="round"/></svg> }

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }) {
  const { t } = useLanguage()
  const [hovered, setHovered] = useState(false)
  const [activeAlertsCount, setActiveAlertsCount] = useState(0)

  useEffect(() => {
    alertsApi.list({ status: 'Active' })
      .then(res => {
        const count = Array.isArray(res) ? res.filter(a => a.status === 'Active').length : 0
        setActiveAlertsCount(count)
      })
      .catch(() => {})
  }, [])
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)

  const sidebarTop = HEADER_TOP + HEADER_H + 14
  const sidebarH   = `calc(100vh - ${sidebarTop + 20}px)`
  const expanded   = hovered || open   // open = mobile tap
  const width      = expanded ? W_EXPANDED : W_COLLAPSED

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:   'fixed',
        left:        SIDEBAR_L,
        top:         sidebarTop,
        width:       width,
        height:      sidebarH,
        zIndex:      30,
        display:     'flex',
        flexDirection: 'column',
        /* Floating glass pill */
        background:    'rgba(20, 70, 105, 0.28)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        border:        '1px solid rgba(255,255,255,0.22)',
        borderRadius:  20,
        boxShadow:     '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
        overflow:      'hidden',
        transition:    'width 0.26s cubic-bezier(0.4,0,0.2,1)',
      }}
      className={!open && !hovered ? 'sidebar-default' : ''}
    >
      {/* Nav items */}
      <nav style={{
        flex: 1,
        padding: '10px 8px',
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}>
<<<<<<< HEAD
        {NAV.map(({ to, label, icon: Icon, exact, badge }) => (
=======
        {NAV_ITEMS.map(({ to, i18nKey, label, icon: Icon, exact, isAlert }) => (
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => { if (window.innerWidth < 1024) onClose?.() }}
            style={({ isActive }) => ({
              display:        'flex',
              flexDirection:  'row',
              alignItems:     'center',
              gap:            10,
              padding:        '9px 10px',
              borderRadius:   10,
              textDecoration: 'none',
              cursor:         'pointer',
              transition:     'background 0.18s, color 0.18s',
              position:       'relative',
              whiteSpace:     'nowrap',
<<<<<<< HEAD
              background:     isActive ? 'rgba(20,220,205,0.18)' : 'transparent',
              border:         isActive ? '1px solid rgba(6,214,199,0.28)' : '1px solid transparent',
              boxShadow:      isActive ? '0 0 12px rgba(6,214,199,0.12)' : 'none',
              color:          isActive ? '#06d6c7' : 'rgba(255,255,255,0.58)',
=======
              background:     isActive
                ? 'linear-gradient(135deg, #06d6c7 0%, #0aa8b8 100%)'
                : 'transparent',
              border:         isActive ? '1px solid rgba(6,214,199,0.45)' : '1px solid transparent',
              boxShadow:      isActive ? '0 0 16px rgba(6,214,199,0.30)' : 'none',
              color:          isActive ? '#020d1e' : 'rgba(255,255,255,0.58)',
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
            })}
          >
            {({ isActive }) => (
              <>
                <Icon />
                {/* Label — visible only when expanded */}
                <span style={{
                  fontSize:      12,
<<<<<<< HEAD
                  fontWeight:    isActive ? 600 : 400,
=======
                  fontWeight:    isActive ? 700 : 400,
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
                  letterSpacing: '0.01em',
                  lineHeight:    1,
                  flex:          1,
                  opacity:       expanded ? 1 : 0,
                  maxWidth:      expanded ? 200 : 0,
                  overflow:      'hidden',
                  transition:    'opacity 0.2s ease, max-width 0.26s cubic-bezier(0.4,0,0.2,1)',
                }}>
<<<<<<< HEAD
                  {label}
                </span>
                {badge != null && (
=======
                  {t(i18nKey, label)}
                </span>
                {isAlert && activeAlertsCount > 0 && (
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
                  <span style={{
                    background:     '#ef4444',
                    color:          '#fff',
                    fontSize:       9,
                    fontWeight:     700,
                    minWidth:       16,
                    height:         16,
                    borderRadius:   '50%',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    lineHeight:     1,
                    flexShrink:     0,
                    opacity:        expanded ? 1 : 0,
                    transition:     'opacity 0.18s ease',
                  }}>
<<<<<<< HEAD
                    {badge}
=======
                    {activeAlertsCount}
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer — only visible when expanded */}
      <div style={{
        padding:      '10px 14px 14px',
        borderTop:    '1px solid rgba(255,255,255,0.07)',
        opacity:       expanded ? 1 : 0,
        transition:   'opacity 0.18s ease',
        overflow:     'hidden',
        whiteSpace:   'nowrap',
      }}>
        <div style={{
          height:      2,
          borderRadius: 2,
          background:  'linear-gradient(90deg, rgba(6,214,199,0.7), rgba(6,214,199,0.1))',
          marginBottom: 8,
        }}/>
<<<<<<< HEAD
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
          AI for<br/>Smarter<br/>Port Operations
=======
        <p style={{ fontSize: 10, color: 'rgba(6,214,199,0.7)', lineHeight: 1.5, fontWeight: 600 }}>
          PORTMIND<br/>Maritime AI
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
        </p>
      </div>
    </aside>
  )
}
