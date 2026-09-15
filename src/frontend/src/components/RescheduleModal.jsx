import { useState, useEffect } from 'react'
import { rescheduleApi } from '../services/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function RescheduleModal({ vesselId, vesselName, isOpen, onClose, onApplied }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [proposal, setProposal] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const fetchProposal = async () => {
    if (!vesselId) return
    try {
      setLoading(true)
      setError(null)
      setSuccessMsg(null)
      const data = await rescheduleApi.propose({ vessel_id: vesselId })
      setProposal(data)
    } catch (err) {
      console.error('Failed to generate proposal:', err)
      setError(err.response?.data?.detail || 'Failed to generate operational reschedule proposal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && vesselId) {
      fetchProposal()
    } else {
      setProposal(null)
      setError(null)
      setSuccessMsg(null)
    }
  }, [isOpen, vesselId])

  if (!isOpen) return null

  const handleApply = async () => {
    if (!proposal) return
    try {
      setApplying(true)
      setError(null)
      const res = await rescheduleApi.apply({
        vessel_id: proposal.vessel_id,
        recommended_eta: proposal.recommended_eta,
        berth_code: proposal.berth_code,
        assigned_cranes: proposal.assigned_cranes,
        route_action: proposal.route_action,
        reason: proposal.reason,
      })
      setSuccessMsg(t('reschedule_success', '72-hour operational schedule updated successfully.'))
      setTimeout(() => {
        onApplied?.(res)
        onClose?.()
      }, 1400)
    } catch (err) {
      console.error('Failed to apply schedule:', err)
      setError(err.response?.data?.detail || 'Failed to apply schedule')
    } finally {
      setApplying(false)
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
        background: 'rgba(2, 13, 30, 0.8)',
        backdropFilter: 'blur(10px)',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'rgba(8, 28, 60, 0.98)',
          border: '1px solid rgba(6, 214, 199, 0.35)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.75), 0 0 32px rgba(6, 214, 199, 0.2)',
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
            background: 'rgba(6, 214, 199, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(6, 214, 199, 0.4)',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#020d1e" strokeWidth="2.2" style={{ width: 20, height: 20 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
                <path d="M10 14l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {t('reschedule_modal_title', '72-Hour Operational Reschedule Proposal')}
              </div>
              <div style={{ fontSize: 12, color: '#06d6c7', fontWeight: 600, marginTop: 2 }}>
                {proposal?.vessel_name || vesselName || `Vessel #${vesselId}`}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 22,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 6,
            }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  margin: '0 auto 16px',
                  border: '3px solid rgba(6, 214, 199, 0.2)',
                  borderTopColor: '#06d6c7',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>
                {t('chat_thinking', 'PortMind AI is analyzing port operational data...')}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 6 }}>
                Evaluating available berths, crane windows, and traffic constraints
              </div>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              <strong>Error:</strong> {error}
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={fetchProposal}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid #ef4444',
                    color: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Retry Proposal Generation
                </button>
              </div>
            </div>
          ) : proposal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Provider Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: proposal.ai_provider === 'gemini' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(6, 214, 199, 0.15)',
                    border: `1px solid ${proposal.ai_provider === 'gemini' ? '#10b981' : '#06d6c7'}`,
                    color: proposal.ai_provider === 'gemini' ? '#34d399' : '#06d6c7',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  {proposal.ai_provider === 'gemini'
                    ? t('reschedule_provider_gemini', 'Gemini 1.5 Pro Maritime Advisor')
                    : t('reschedule_provider_fallback', 'Deterministic Rule Engine Fallback')}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.45)' }}>
                  Confidence: {Math.round((proposal.confidence || 0.85) * 100)}%
                </div>
              </div>

              {/* ETA Comparison Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 4 }}>
                    {t('reschedule_current_eta', 'Current Scheduled ETA')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>
                    {proposal.current_eta || 'Standard Schedule'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#06d6c7', marginBottom: 4, fontWeight: 600 }}>
                    {t('reschedule_recommended_eta', 'Recommended Optimized ETA')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                    {proposal.recommended_eta || 'Pending Adjustment'}
                  </div>
                </div>
              </div>

              {/* Berths & Cranes Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(6, 214, 199, 0.05)',
                    border: '1px solid rgba(6, 214, 199, 0.18)',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 4 }}>
                    {t('reschedule_berth', 'Allocated Berth')}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#06d6c7' }}>
                    {proposal.berth_code || 'Auto-Optimized Berth'}
                  </div>
                </div>

                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'rgba(6, 214, 199, 0.05)',
                    border: '1px solid rgba(6, 214, 199, 0.18)',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.6)', marginBottom: 4 }}>
                    {t('reschedule_cranes', 'Dedicated Cranes')}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    {proposal.assigned_cranes && proposal.assigned_cranes.length > 0
                      ? proposal.assigned_cranes.join(', ')
                      : 'Standard Gang Allocated'}
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 6 }}>
                  {t('reschedule_reason', 'Decision Support & Optimization Rationale')}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5 }}>
                  {proposal.reason}
                </div>
              </div>

              {/* Constraints Verification Note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: proposal.is_constraint_valid ? '#34d399' : '#f59e0b',
                }}
              >
                <span>{proposal.is_constraint_valid ? '✓' : 'ℹ'}</span>
                <span>
                  {proposal.is_constraint_valid
                    ? t('reschedule_constraints_valid', 'Physical Constraints Verified (Draft, Length, Availability)')
                    : t('reschedule_constraints_adjusted', 'Automated Backend Constraint Correction Applied')}
                </span>
              </div>

              {/* Success Banner */}
              {successMsg && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid #10b981',
                    color: '#34d399',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  ✓ {successMsg}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        {proposal && !loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(6, 214, 199, 0.03)',
            }}
          >
            <button
              onClick={fetchProposal}
              disabled={applying}
              style={{
                background: 'none',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {t('reschedule_repropose_btn', 'Regenerate')}
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                disabled={applying}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  padding: '9px 14px',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {t('common_cancel', 'Cancel')}
              </button>
              <button
                onClick={handleApply}
                disabled={applying || !!successMsg}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
                  border: 'none',
                  color: '#020d1e',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: applying || successMsg ? 'not-allowed' : 'pointer',
                  opacity: applying || successMsg ? 0.7 : 1,
                  boxShadow: '0 0 16px rgba(6, 214, 199, 0.35)',
                }}
              >
                {applying
                  ? t('reschedule_applying', 'Applying...')
                  : t('reschedule_apply_btn', 'Confirm & Apply Schedule to 72h Plan')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
