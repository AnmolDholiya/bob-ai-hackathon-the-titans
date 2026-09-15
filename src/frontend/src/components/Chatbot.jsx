import { useState, useRef, useEffect } from 'react'
import { chatApi } from '../services/api'
import { useLanguage } from '../i18n/LanguageContext'

export default function Chatbot() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Welcome to PortMind AI. I am your operational maritime assistant. Ask me about vessel congestion, 72-hour berth allocations, or operational rescheduling.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (open) {
      scrollToBottom()
    }
  }, [messages, open])

  const handleSend = async (userText) => {
    const query = userText || input
    if (!query.trim() || loading) return

    const userMsg = {
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Build history for backend
      const historyPayload = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await chatApi.send({
        message: query.trim(),
        history: historyPayload,
      })

      const botReply = {
        role: 'assistant',
        content: res.reply || 'No operational response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_action: res.suggested_action,
      }
      setMessages(prev => [...prev, botReply])
    } catch (err) {
      console.error('Chat error:', err)
      const errorReply = {
        role: 'assistant',
        content: 'System notice: Unable to contact PortMind intelligence service. Please check your network connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, errorReply])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 45 }}>
      {/* Floating Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            color: '#020d1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(6, 214, 199, 0.45), 0 0 12px rgba(6, 214, 199, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.08)'
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(6, 214, 199, 0.6)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 214, 199, 0.45)'
          }}
          title="PortMind AI Assistant"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 26, height: 26 }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="12" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
        </button>
      )}

      {/* Expanded Chatbox */}
      {open && (
        <div
          style={{
            width: 380,
            height: 520,
            background: 'rgba(8, 28, 60, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(6, 214, 199, 0.35)',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 32px rgba(6, 214, 199, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(6, 214, 199, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#020d1e" strokeWidth="2.2" style={{ width: 18, height: 18 }}>
                  <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M6 10v2a6 6 0 0 0 12 0v-2" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="8" y1="22" x2="16" y2="22" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  {t('chat_title', 'PortMind AI Assistant')}
                </div>
                <div style={{ fontSize: 10, color: '#06d6c7', letterSpacing: '0.02em' }}>
                  {t('chat_subtitle', 'Maritime domain intelligence')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
                onMouseEnter={e => e.target.style.color = '#fff'}
                onMouseLeave={e => e.target.style.color = 'rgba(255, 255, 255, 0.6)'}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            style={{
              flex: 1,
              padding: '14px 16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {messages.map((m, idx) => {
              const isBot = m.role === 'assistant'
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isBot ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isBot ? 'flex-start' : 'flex-end',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: isBot ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                      background: isBot ? 'rgba(255, 255, 255, 0.07)' : 'linear-gradient(135deg, #06d6c7 0%, #0aa8b8 100%)',
                      border: isBot ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
                      color: isBot ? '#e2e8f0' : '#020d1e',
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                      fontWeight: isBot ? 400 : 600,
                    }}
                  >
                    {m.content}
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255, 255, 255, 0.35)', marginTop: 3 }}>
                    {m.timestamp}
                  </span>
                </div>
              )
            })}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 2px',
                  background: 'rgba(6, 214, 199, 0.08)',
                  border: '1px solid rgba(6, 214, 199, 0.2)',
                  fontSize: 11,
                  color: '#06d6c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#06d6c7',
                    animation: 'pulse 1s infinite',
                  }}
                />
                {t('chat_thinking', 'Analyzing port operations...')}
              </div>
            )}

            {/* Suggested Queries if first message */}
            {messages.length === 1 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('chat_suggested', 'Suggested queries:')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    t('chat_q1', 'Which vessels currently have high congestion risk?'),
                    t('chat_q2', 'What is the current berth utilization at Hamburg and Antwerp?'),
                    t('chat_q3', 'Recommend an operational rescheduling plan for delayed vessels.'),
                    t('chat_q4', 'Summarize the 72-hour port operations forecast.'),
                  ].map((q, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSend(q)}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: 'rgba(6, 214, 199, 0.05)',
                        border: '1px solid rgba(6, 214, 199, 0.15)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(6, 214, 199, 0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(6, 214, 199, 0.05)'}
                    >
                      • {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={e => { e.preventDefault(); handleSend() }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(6, 214, 199, 0.02)',
            }}
          >
            <input
              type="text"
              placeholder={t('chat_placeholder', 'Ask about vessel delays, berths, or operational risk...')}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                background: input.trim() ? 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: input.trim() ? '#020d1e' : 'rgba(255, 255, 255, 0.3)',
                fontWeight: 700,
                fontSize: 12,
                cursor: input.trim() && !loading ? 'pointer' : 'default',
              }}
            >
              {t('chat_send', 'Send')}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
