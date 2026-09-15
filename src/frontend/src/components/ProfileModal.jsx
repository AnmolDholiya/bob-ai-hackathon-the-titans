import { useState, useEffect } from 'react'
import { profileApi } from '../services/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function ProfileModal({ isOpen, onClose }) {
  const { t, language, setLanguage } = useLanguage()
  const [activeTab, setActiveTab] = useState('info') // info | password | prefs

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    mobile: '',
    role: '',
    language: 'en',
    notify_email: true,
    notify_browser: true,
    notify_high_risk: true,
  })

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: '' })

  useEffect(() => {
    if (isOpen) {
      loadProfile()
      setMsg({ text: '', type: '' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [isOpen])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await profileApi.get()
      setProfile(data)
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setMsg({ text: '', type: '' })
      const updated = await profileApi.update({
        full_name: profile.full_name,
        email: profile.email,
        mobile: profile.mobile,
        role: profile.role,
        language: profile.language,
        notify_email: profile.notify_email,
        notify_browser: profile.notify_browser,
        notify_high_risk: profile.notify_high_risk,
      })
      setProfile(updated)
      if (updated.language && updated.language !== language) {
        setLanguage(updated.language)
      }
      setMsg({ text: t('profile_saved', 'Profile updated successfully.'), type: 'success' })
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || 'Failed to update profile', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMsg({ text: t('profile_pw_match_err', 'New passwords do not match.'), type: 'error' })
      return
    }
    try {
      setLoading(true)
      setMsg({ text: '', type: '' })
      await profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setMsg({ text: t('profile_pw_changed', 'Password updated successfully.'), type: 'success' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setMsg({ text: err.response?.data?.detail || 'Failed to change password', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(2, 13, 30, 0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'rgba(8, 28, 60, 0.96)',
          border: '1px solid rgba(6, 214, 199, 0.3)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 214, 199, 0.18)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(6, 214, 199, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(6, 214, 199, 0.15)',
                border: '1.5px solid #06d6c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#06d6c7" strokeWidth="2" style={{ width: 18, height: 18 }}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {t('profile_modal_title', 'Port Operator Profile')}
              </div>
              <div style={{ fontSize: 12, color: '#06d6c7' }}>
                {profile.role || 'Port Controller'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
            }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingInline: 24,
            gap: 20,
          }}
        >
          {[
            { id: 'info', label: t('profile_tab_info', 'Operator Info') },
            { id: 'password', label: t('profile_tab_password', 'Change Password') },
            { id: 'prefs', label: t('profile_tab_prefs', 'Preferences') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setMsg({ text: '', type: '' }) }}
              style={{
                background: 'none',
                border: 'none',
                padding: '12px 4px',
                color: activeTab === tab.id ? '#06d6c7' : 'rgba(255, 255, 255, 0.55)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 13,
                borderBottom: activeTab === tab.id ? '2px solid #06d6c7' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Message */}
        {msg.text && (
          <div
            style={{
              margin: '14px 24px 0',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12,
              background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: msg.type === 'success' ? '#34d399' : '#f87171',
            }}
          >
            {msg.text}
          </div>
        )}

        {/* Tab Content */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {activeTab === 'info' && (
            <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('profile_name', 'Full Name')}
                </label>
                <input
                  type="text"
                  value={profile.full_name || ''}
                  onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('profile_email', 'Email Address')}
                </label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('profile_mobile', 'Mobile Contact')}
                </label>
                <input
                  type="text"
                  value={profile.mobile || ''}
                  onChange={e => setProfile({ ...profile, mobile: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('profile_role', 'Port Authority Role')}
                </label>
                <input
                  type="text"
                  value={profile.role || ''}
                  onChange={e => setProfile({ ...profile, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: '11px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
                  border: 'none',
                  color: '#020d1e',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t('common_loading', 'Saving...') : t('common_save', 'Save Changes')}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('profile_current_pw', 'Current Password')}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter current password (default: operator123)"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('profile_new_pw', 'New Password')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('profile_confirm_pw', 'Confirm New Password')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: '11px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
                  border: 'none',
                  color: '#020d1e',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t('common_loading', 'Updating...') : t('profile_tab_password', 'Change Password')}
              </button>
            </form>
          )}

          {activeTab === 'prefs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Language selection */}
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  {t('topbar_language', 'Preferred Language')}
                </label>
                <select
                  value={profile.language || language}
                  onChange={e => {
                    const l = e.target.value
                    setProfile({ ...profile, language: l })
                    setLanguage(l)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  <option value="en" style={{ background: '#081c3c' }}>English (US/UK)</option>
                  <option value="gu" style={{ background: '#081c3c' }}>ગુજરાતી (Gujarati)</option>
                  <option value="hi" style={{ background: '#081c3c' }}>हिन्दी (Hindi)</option>
                </select>
              </div>

              {/* Notification Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={profile.notify_email}
                    onChange={e => setProfile({ ...profile, notify_email: e.target.checked })}
                    style={{ accentColor: '#06d6c7', width: 16, height: 16 }}
                  />
                  {t('profile_notify_email', 'Email alerts for critical delays')}
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={profile.notify_browser}
                    onChange={e => setProfile({ ...profile, notify_browser: e.target.checked })}
                    style={{ accentColor: '#06d6c7', width: 16, height: 16 }}
                  />
                  {t('profile_notify_browser', 'In-app browser push notifications')}
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={profile.notify_high_risk}
                    onChange={e => setProfile({ ...profile, notify_high_risk: e.target.checked })}
                    style={{ accentColor: '#06d6c7', width: 16, height: 16 }}
                  />
                  {t('profile_notify_high_risk', 'Instant popups for High Congestion Risk')}
                </label>
              </div>

              <button
                type="button"
                onClick={handleSaveInfo}
                disabled={loading}
                style={{
                  marginTop: 10,
                  padding: '11px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
                  border: 'none',
                  color: '#020d1e',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t('common_loading', 'Saving...') : t('common_save', 'Save Preferences')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
