<<<<<<< HEAD
import { useState } from 'react'
import { HEADER_H, HEADER_TOP } from '../layouts/AppLayout'
=======
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HEADER_H, HEADER_TOP } from '../layouts/AppLayout'
import LiveClock from './LiveClock'
import NotificationPanel from './NotificationPanel'
import ProfileModal from './ProfileModal'
import { useLanguage } from '../i18n/LanguageContext'
import { notificationsApi, profileApi } from '../services/api'
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)

// ── Icon atoms ────────────────────────────────────────────────────────────────
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    style={{ width: 12, height: 12, opacity: 0.55 }}>
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── TopBar ────────────────────────────────────────────────────────────────────
export default function TopBar({ onMenuToggle }) {
<<<<<<< HEAD
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
=======
  const navigate = useNavigate()
  const { language, setLanguage, t } = useLanguage()
  const [search, setSearch] = useState('')

  // Dropdown states
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  // Badge count and operator info
  const [unreadCount, setUnreadCount] = useState(0)
  const [operatorName, setOperatorName] = useState('Port Operator')

  useEffect(() => {
    // Initial fetch of unread count and operator profile
    notificationsApi.list({ unread_only: true, limit: 1 })
      .then(res => {
        // fetch unread count
        notificationsApi.list().then(all => {
          const unread = (all || []).filter(n => !n.is_read).length
          setUnreadCount(unread)
        })
      })
      .catch(() => {})

    profileApi.get()
      .then(prof => {
        if (prof?.full_name) setOperatorName(prof.full_name)
      })
      .catch(() => {})
  }, [])

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'gu', label: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  ]

  const currentLangObj = languages.find(l => l.code === language) || languages[0]

  return (
    <>
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

        {/* ── Logo & Brand (Clickable to /) ── */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            height: 52, paddingInline: 14, borderRadius: 14,
            background: 'rgba(8,28,60,0.52)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.13)',
            cursor: 'pointer',
            transition: 'border-color 0.2s, transform 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(6,214,199,0.45)'
            e.currentTarget.style.transform = 'scale(1.01)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Return to Home Dashboard"
        >
          {/* Cyan wave mark */}
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(6,214,199,0.45)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 20, height: 20 }}>
              <path d="M2 8 Q6 4 12 8 Q18 12 22 8"  stroke="white" strokeWidth="2"   strokeLinecap="round" fill="none"/>
              <path d="M2 13 Q6 9 12 13 Q18 17 22 13" stroke="rgba(255,255,255,0.75)" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
              <path d="M2 18 Q6 14 12 18 Q18 22 22 18" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '0.08em' }}>PORTMIND</div>
            <div style={{ fontSize: 10, color: '#06d6c7', marginTop: 3, letterSpacing: '0.04em', fontWeight: 500 }}>
              {t('brand_short_tagline', 'Navigate Smarter. Operate Better.')}
            </div>
          </div>
        </div>

        {/* ── Search bar — takes up center space ── */}
        <div style={{ flex: 1, maxWidth: 520, margin: '0 auto', position: 'relative' }}>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                     width: 17, height: 17, color: 'rgba(255,255,255,0.38)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder={t('common_search', 'Search vessel, port, or voyage...')}
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
          position: 'relative',
        }}>

          {/* ── Language Selector Dropdown ── */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setLangDropdownOpen(o => !o)
                setNotifOpen(false)
              }}
              className="hdr-ctrl"
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              title="Select Display Language"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#06d6c7" strokeWidth="1.8"
                style={{ width: 16, height: 16, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {currentLangObj.label}
              </span>
              <ChevronDown />
            </button>

            {langDropdownOpen && (
              <>
                <div
                  onClick={() => setLangDropdownOpen(false)}
                  style={{ position: 'fixed', inset: 0, zIndex: 35 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 48,
                    left: 0,
                    width: 140,
                    background: 'rgba(8, 28, 60, 0.96)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(6, 214, 199, 0.3)',
                    borderRadius: 12,
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                    padding: '6px',
                    zIndex: 36,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code)
                        setLangDropdownOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: language === l.code ? 'rgba(6, 214, 199, 0.18)' : 'transparent',
                        border: 'none',
                        color: language === l.code ? '#06d6c7' : '#fff',
                        fontSize: 13,
                        fontWeight: language === l.code ? 700 : 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (language !== l.code) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                      }}
                      onMouseLeave={e => {
                        if (language !== l.code) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span>{l.label}</span>
                      {language === l.code && <span style={{ fontSize: 12 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Live Digital Clock ── */}
          <LiveClock />

          {/* ── Real-time Notifications Bell ── */}
          <button
            onClick={() => {
              setNotifOpen(o => !o)
              setLangDropdownOpen(false)
            }}
            className="hdr-ctrl"
            style={{
              position: 'relative', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
            }}
            title={t('topbar_notifications', 'Notifications')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8"
              style={{ width: 18, height: 18 }}>
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 5, right: 5,
                minWidth: 16, height: 16, padding: '0 3px',
                borderRadius: 8,
                background: '#ef4444',
                color: '#fff',
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* ── Operator Profile Button ── */}
          <button
            onClick={() => {
              setProfileOpen(true)
              setNotifOpen(false)
              setLangDropdownOpen(false)
            }}
            className="hdr-ctrl"
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            title={t('topbar_profile', 'Operator Profile')}
          >
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
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {operatorName}
            </span>
            <ChevronDown />
          </button>
        </div>
      </header>

      {/* Popups & Drawers */}
      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
>>>>>>> 3b90e15 (feat: complete PortMind production integration — AI 72h operational schedule, XGBoost+LightGBM ensemble, CSV ingestion, i18n & command center)
  )
}
