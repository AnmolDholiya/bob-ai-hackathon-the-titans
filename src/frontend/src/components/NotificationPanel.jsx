import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../services/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function NotificationPanel({ isOpen, onClose, onUnreadCountChange }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationsApi.list({ limit: 30 })
      setNotifications(data || [])
      const unread = (data || []).filter(n => !n.is_read).length
      onUnreadCountChange?.(unread)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      onUnreadCountChange?.(0)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClear = async () => {
    try {
      await notificationsApi.clear()
      setNotifications([])
      onUnreadCountChange?.(0)
    } catch (err) {
      console.error(err)
    }
  }

  const handleClickItem = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationsApi.markRead(notif.id)
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
        const remaining = notifications.filter(n => !n.is_read && n.id !== notif.id).length
        onUnreadCountChange?.(remaining)
      } catch (err) {
        console.error(err)
      }
    }
    if (notif.action_url) {
      onClose?.()
      navigate(notif.action_url)
    }
  }

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical':
      case 'error':
        return '#ef4444'
      case 'warning':
        return '#f59e0b'
      case 'success':
        return '#10b981'
      default:
        return '#06d6c7'
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'transparent',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 24,
          width: 380,
          maxHeight: 'calc(100vh - 120px)',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(8, 28, 60, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(6, 214, 199, 0.3)',
          borderRadius: 16,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 24px rgba(6, 214, 199, 0.15)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(6, 214, 199, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
              {t('notif_title', 'Real-time Notifications')}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 10,
                background: 'rgba(6, 214, 199, 0.2)',
                color: '#06d6c7',
                fontWeight: 600,
              }}
            >
              {notifications.filter(n => !n.is_read).length} {t('notif_unread', 'unread')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleMarkAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: 11,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
              onMouseEnter={e => e.target.style.color = '#06d6c7'}
              onMouseLeave={e => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
            >
              {t('notif_mark_all', 'Mark read')}
            </button>
            <button
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: 11,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
              onMouseEnter={e => e.target.style.color = '#ef4444'}
              onMouseLeave={e => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
            >
              {t('common_clear_all', 'Clear')}
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', maxHeight: 420 }}>
          {loading && notifications.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {t('common_loading', 'Loading...')}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              {t('notif_empty', 'No new notifications.')}
            </div>
          ) : (
            notifications.map((n) => {
              const borderCol = getSeverityColor(n.severity)
              return (
                <div
                  key={n.id}
                  onClick={() => handleClickItem(n)}
                  style={{
                    padding: '12px 18px',
                    borderLeft: `3px solid ${borderCol}`,
                    background: n.is_read ? 'transparent' : 'rgba(6, 214, 199, 0.06)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.is_read ? 'transparent' : 'rgba(6, 214, 199, 0.06)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: '#fff' }}>
                      {n.title}
                    </div>
                    {!n.is_read && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06d6c7', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.4, marginBottom: 6 }}>
                    {n.message}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.35)' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {n.vessel_name && (
                      <span style={{ fontSize: 10, color: '#06d6c7', fontWeight: 600, background: 'rgba(6,214,199,0.1)', padding: '1px 6px', borderRadius: 4 }}>
                        {n.vessel_name}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
