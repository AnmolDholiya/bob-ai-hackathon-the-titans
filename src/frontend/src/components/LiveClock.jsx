import { useState, useEffect } from 'react'

export default function LiveClock() {
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Format time: HH:MM:SS UTC or local
      const hours = String(now.getUTCHours()).padStart(2, '0')
      const minutes = String(now.getUTCMinutes()).padStart(2, '0')
      const seconds = String(now.getUTCSeconds()).padStart(2, '0')
      setTimeStr(`${hours}:${minutes}:${seconds} UTC`)

      // Format date: DD MMM YYYY
      const day = String(now.getUTCDate()).padStart(2, '0')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const month = monthNames[now.getUTCMonth()]
      const year = now.getUTCFullYear()
      setDateStr(`${day} ${month} ${year}`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className="hidden-sm"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingInline: 12,
        height: 38,
        borderRadius: 10,
        background: 'rgba(6, 214, 199, 0.08)',
        border: '1px solid rgba(6, 214, 199, 0.22)',
        color: '#06d6c7',
        fontFamily: 'monospace',
        fontSize: 12,
        letterSpacing: '0.04em',
        userSelect: 'none',
      }}
      title="Live Port Operations Master Clock (UTC)"
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#06d6c7',
          boxShadow: '0 0 8px #06d6c7',
          animation: 'pulse 2s infinite',
        }}
      />
      <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{dateStr}</span>
      <span style={{ color: '#06d6c7', fontWeight: 700 }}>{timeStr}</span>
    </div>
  )
}
