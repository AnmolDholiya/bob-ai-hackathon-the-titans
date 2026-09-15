// ─────────────────────────────────────────────────────────────────────────────
// LiveRouteMap — Interactive Global Maritime HUD & World Shipping Lanes
// Realistic World Map vectors + Animated Vessels + Interactive Cursor Tooltips
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'

// ── Global Strategic Ports (Coordinates mapped to 640x360 SVG canvas) ────────
const WORLD_PORTS = [
  { id: 'RTM', name: 'Rotterdam', country: 'Netherlands', x: 334, y: 108, berths: 8, load: '78%', status: 'Congested' },
  { id: 'HAM', name: 'Hamburg',   country: 'Germany',     x: 346, y: 104, berths: 6, load: '64%', status: 'Operational' },
  { id: 'LON', name: 'London',    country: 'UK',          x: 326, y: 107, berths: 5, load: '52%', status: 'Operational' },
  { id: 'LIS', name: 'Lisbon',    country: 'Portugal',    x: 312, y: 136, berths: 4, load: '45%', status: 'Operational' },
  { id: 'VAL', name: 'Valencia',  country: 'Spain',       x: 328, y: 134, berths: 5, load: '61%', status: 'Operational' },
  { id: 'NYC', name: 'New York',  country: 'USA',         x: 188, y: 125, berths: 9, load: '71%', status: 'Operational' },
  { id: 'SIN', name: 'Singapore', country: 'Singapore',   x: 486, y: 208, berths: 12, load: '84%', status: 'High Traffic' },
  { id: 'SHA', name: 'Shanghai',  country: 'China',       x: 520, y: 142, berths: 14, load: '89%', status: 'Congested' },
  { id: 'DXB', name: 'Dubai',     country: 'UAE',         x: 418, y: 154, berths: 7, load: '59%', status: 'Operational' },
]

// ── Active Live Routes & Animated Vessels ─────────────────────────────────────
const ACTIVE_VESSELS = [
  {
    id: 'v1',
    name: 'PORTMIND-ALPHA',
    imo: '9312457',
    type: 'Ultra Large Container',
    speed: 18.2,
    route: 'Rotterdam → Hamburg',
    origin: 'RTM',
    dest: 'HAM',
    eta: 'Today, 18:30 UTC',
    risk: 'Medium',
    riskScore: 36,
    pathD: 'M334,108 Q340,105 346,104',
    speedFactor: 0.0006,
    cargo: '18,500 TEU',
    color: '#06d6c7',
  },
  {
    id: 'v2',
    name: 'MSC CATERINA',
    imo: '9421883',
    type: 'Container Ship',
    speed: 19.4,
    route: 'Singapore → Rotterdam',
    origin: 'SIN',
    dest: 'RTM',
    eta: 'Tomorrow, 06:45 UTC',
    risk: 'High',
    riskScore: 74,
    pathD: 'M486,208 C440,195 418,154 390,140 C350,135 338,120 334,108',
    speedFactor: 0.00035,
    cargo: '22,000 TEU',
    color: '#ef4444',
  },
  {
    id: 'v3',
    name: 'EVERGREEN TRIUMPH',
    imo: '9633042',
    type: 'Container Carrier',
    speed: 16.5,
    route: 'Shanghai → Singapore',
    origin: 'SHA',
    dest: 'SIN',
    eta: '16 Sep, 12:00 UTC',
    risk: 'High',
    riskScore: 68,
    pathD: 'M520,142 C515,170 500,190 486,208',
    speedFactor: 0.00045,
    cargo: '20,100 TEU',
    color: '#f59e0b',
  },
  {
    id: 'v4',
    name: 'MAERSK KENSINGTON',
    imo: '9518774',
    type: 'Panamax Carrier',
    speed: 17.8,
    route: 'New York → London',
    origin: 'NYC',
    dest: 'LON',
    eta: '17 Sep, 04:15 UTC',
    risk: 'Low',
    riskScore: 18,
    pathD: 'M188,125 C230,105 280,100 326,107',
    speedFactor: 0.0004,
    cargo: '14,200 TEU',
    color: '#06d6c7',
  },
  {
    id: 'v5',
    name: 'PORTMIND-BETA',
    imo: '9487561',
    type: 'Feeder Container',
    speed: 15.0,
    route: 'Valencia → Lisbon',
    origin: 'VAL',
    dest: 'LIS',
    eta: 'Today, 22:00 UTC',
    risk: 'Medium',
    riskScore: 42,
    pathD: 'M328,134 Q320,140 312,136',
    speedFactor: 0.0007,
    cargo: '6,400 TEU',
    color: '#fbbf24',
  },
]

// ── SVG World Continents Path Data (Mercator / Equirectangular Projection) ───
// Precision coastlines for North America, South America, Eurasia, Africa, Australia
const CONTINENT_PATHS = [
  // North America
  'M 100,50 L 140,45 L 180,42 L 210,55 L 230,80 L 220,110 L 205,115 L 195,135 L 185,150 L 165,160 L 155,145 L 130,135 L 115,105 L 95,85 Z',
  // Greenland
  'M 240,30 L 270,25 L 285,45 L 265,65 L 245,55 Z',
  // South America
  'M 175,170 L 195,175 L 220,195 L 235,225 L 225,265 L 205,305 L 190,320 L 180,290 L 175,250 L 165,210 L 170,185 Z',
  // Europe & Scandinavia
  'M 315,65 L 340,55 L 355,60 L 350,85 L 375,95 L 370,115 L 350,118 L 335,112 L 325,120 L 315,135 L 305,125 L 310,105 L 318,85 Z',
  // British Isles
  'M 315,95 L 325,92 L 324,105 L 316,106 Z',
  // Africa
  'M 318,145 L 350,140 L 385,155 L 395,185 L 385,230 L 365,275 L 340,295 L 330,270 L 315,225 L 305,175 L 310,150 Z',
  // Eurasia (Russia & East/South Asia)
  'M 375,85 L 430,70 L 500,65 L 560,75 L 580,105 L 565,125 L 535,120 L 515,145 L 495,170 L 470,175 L 445,160 L 415,150 L 385,130 L 375,100 Z',
  // Indian Subcontinent
  'M 430,155 L 450,165 L 445,195 L 435,210 L 425,185 Z',
  // Southeast Asia & Indonesia
  'M 475,180 L 495,185 L 505,210 L 485,225 L 465,200 Z',
  // Japan
  'M 555,115 L 565,110 L 568,130 L 558,135 Z',
  // Australia
  'M 505,245 L 545,240 L 565,265 L 555,305 L 525,310 L 495,285 L 495,260 Z',
]

export default function LiveRouteMap() {
  const [hoveredVessel, setHoveredVessel] = useState(null)
  const [hoveredPort, setHoveredPort] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('All') // 'All' | 'High' | 'Normal'
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Animation references for multiple vessels
  const pathsRef = useRef({})
  const vesselsPosRef = useRef(ACTIVE_VESSELS.map(v => ({ id: v.id, t: Math.random() * 0.8 })))
  const [vesselCoords, setVesselCoords] = useState({})
  const requestRef = useRef(null)

  // Step vessel positions smoothly
  useEffect(() => {
    const animate = () => {
      const updated = {}
      vesselsPosRef.current.forEach(item => {
        const vConfig = ACTIVE_VESSELS.find(v => v.id === item.id)
        if (!vConfig) return

        item.t = (item.t + vConfig.speedFactor) % 1
        const pathEl = pathsRef.current[item.id]
        if (pathEl) {
          const totalLen = pathEl.getTotalLength()
          const pt = pathEl.getPointAtLength(item.t * totalLen)
          // Compute heading angle
          const nextPt = pathEl.getPointAtLength(Math.min(totalLen, (item.t + 0.01) * totalLen))
          const angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x) * (180 / Math.PI)
          updated[item.id] = { x: pt.x, y: pt.y, angle }
        }
      })
      setVesselCoords(updated)
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  // Filter vessels
  const visibleVessels = ACTIVE_VESSELS.filter(v => {
    if (selectedFilter === 'High') return v.risk === 'High'
    if (selectedFilter === 'Normal') return v.risk !== 'High'
    return true
  })

  return (
    <div
      style={{
        position: 'relative',
        background: 'radial-gradient(120% 120% at 50% 0%, rgba(10, 36, 70, 0.55) 0%, rgba(3, 15, 36, 0.75) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(6, 214, 199, 0.28)',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* ── Card Header HUD ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(2, 10, 24, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#06d6c7',
              boxShadow: '0 0 10px #06d6c7',
              animation: 'pulse 2s infinite',
            }}
          />
          <div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>
              Global Maritime Radar
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginLeft: 8, fontFamily: 'monospace' }}>
              LIVE SATELLITE AIS · 5 VESSELS STREAMING
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {['All', 'High', 'Normal'].map(f => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 6,
                border: selectedFilter === f ? '1px solid #06d6c7' : '1px solid rgba(255,255,255,0.1)',
                background: selectedFilter === f ? 'rgba(6,214,199,0.2)' : 'rgba(255,255,255,0.03)',
                color: selectedFilter === f ? '#06d6c7' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f === 'High' ? '🔴 High Risk' : f === 'Normal' ? '🟢 Normal' : 'All Vessels'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main SVG Map Canvas ── */}
      <div
        style={{ position: 'relative', width: '100%', cursor: 'crosshair' }}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        }}
        onMouseLeave={() => {
          setHoveredVessel(null)
          setHoveredPort(null)
        }}
      >
        <svg
          viewBox="0 0 640 350"
          style={{ width: '100%', display: 'block', background: 'transparent' }}
          aria-label="Interactive Global Maritime Map"
        >
          <defs>
            {/* Hexagonal / Grid Matrix pattern */}
            <pattern id="world-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(6, 214, 199, 0.04)" strokeWidth="0.5" />
            </pattern>

            {/* Glowing filters */}
            <filter id="cyan-bloom" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="vessel-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Vessel Icon Shape */}
            <g id="ship-icon">
              <path
                d="M 0,-6 L 4,3 L 0,1 L -4,3 Z"
                fill="#06d6c7"
                stroke="#ffffff"
                strokeWidth="0.8"
                filter="url(#cyan-bloom)"
              />
            </g>
          </defs>

          {/* Oceanic Canvas Grid */}
          <rect width="640" height="350" fill="url(#world-grid)" />

          {/* Latitude / Longitude Subtle Lines */}
          {[90, 175, 260].map(y => (
            <line key={`lat-${y}`} x1="0" y1={y} x2="640" y2={y} stroke="rgba(255,255,255,0.03)" strokeDasharray="3,6" />
          ))}
          {[160, 320, 480].map(x => (
            <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="350" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,6" />
          ))}

          {/* ── Vector World Continents ── */}
          <g fill="rgba(8, 38, 76, 0.65)" stroke="rgba(6, 214, 199, 0.35)" strokeWidth="1" strokeLinejoin="round">
            {CONTINENT_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                style={{
                  transition: 'fill 0.3s',
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }}
              />
            ))}
          </g>

          {/* ── Maritime Shipping Lanes (Corridors) ── */}
          {ACTIVE_VESSELS.map(v => (
            <path
              key={`path-${v.id}`}
              ref={el => { pathsRef.current[v.id] = el }}
              d={v.pathD}
              fill="none"
              stroke={v.risk === 'High' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(6, 214, 199, 0.35)'}
              strokeWidth="1.6"
              strokeDasharray={v.risk === 'High' ? '4,4' : '6,4'}
              style={{
                filter: 'drop-shadow(0 0 4px rgba(6,214,199,0.2))',
              }}
            />
          ))}

          {/* ── World Ports ── */}
          {WORLD_PORTS.map(p => {
            const isHovered = hoveredPort?.id === p.id
            return (
              <g
                key={p.id}
                onMouseEnter={() => { setHoveredPort(p); setHoveredVessel(null) }}
                onMouseLeave={() => setHoveredPort(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Radar ring on hover */}
                {isHovered && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="12"
                    fill="none"
                    stroke="#06d6c7"
                    strokeWidth="1.2"
                    opacity="0.8"
                    style={{ animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }}
                  />
                )}
                {/* Port Beacon */}
                <circle cx={p.x} cy={p.y} r={isHovered ? 5.5 : 4} fill="#06d6c7" filter="url(#cyan-bloom)" />
                <circle cx={p.x} cy={p.y} r="1.8" fill="#ffffff" />

                {/* Port Label */}
                <text
                  x={p.x + (p.x > 450 ? -8 : 8)}
                  y={p.y - 6}
                  textAnchor={p.x > 450 ? 'end' : 'start'}
                  fill={isHovered ? '#06d6c7' : 'rgba(255,255,255,0.75)'}
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="Inter, system-ui, sans-serif"
                  style={{ pointerEvents: 'none', textShadow: '0 2px 4px #000' }}
                >
                  {p.name}
                </text>
              </g>
            )
          })}

          {/* ── Animated Vessels Running Across Corridors ── */}
          {visibleVessels.map(v => {
            const coords = vesselCoords[v.id]
            if (!coords) return null
            const isHovered = hoveredVessel?.id === v.id

            return (
              <g
                key={v.id}
                transform={`translate(${coords.x}, ${coords.y}) rotate(${coords.angle + 90})`}
                onMouseEnter={() => { setHoveredVessel(v); setHoveredPort(null) }}
                onMouseLeave={() => setHoveredVessel(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Wake pulse ripple */}
                <circle
                  r={isHovered ? 14 : 9}
                  fill={v.risk === 'High' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 214, 199, 0.22)'}
                  style={{ animation: 'pulse 1.8s infinite' }}
                />

                {/* Vessel Arrow Indicator */}
                <path
                  d="M 0,-7 L 5,4 L 0,2 L -5,4 Z"
                  fill={v.risk === 'High' ? '#ef4444' : '#06d6c7'}
                  stroke="#ffffff"
                  strokeWidth="1"
                  filter="url(#vessel-glow)"
                />

                {/* Live Speed vector / wake tail */}
                <line x1="0" y1="2" x2="0" y2="9" stroke={v.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </g>
            )
          })}
        </svg>

        {/* ── Interactive Floating HUD Tooltip on Cursor Hover ── */}
        {hoveredVessel && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(tooltipPos.x + 12, 12), 430),
              top: Math.max(tooltipPos.y - 120, 10),
              zIndex: 30,
              pointerEvents: 'none',
              width: 220,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(2, 12, 28, 0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${hoveredVessel.risk === 'High' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(6, 214, 199, 0.5)'}`,
              boxShadow: '0 12px 30px rgba(0,0,0,0.6), 0 0 16px rgba(6, 214, 199, 0.2)',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{hoveredVessel.name}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: hoveredVessel.risk === 'High' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 214, 199, 0.2)',
                  color: hoveredVessel.risk === 'High' ? '#f87171' : '#06d6c7',
                }}
              >
                {hoveredVessel.risk} Risk · {hoveredVessel.riskScore}%
              </span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginBottom: 6 }}>
              IMO:{hoveredVessel.imo} · {hoveredVessel.type}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Corridor:</span>
                <span style={{ color: '#06d6c7', fontWeight: 600 }}>{hoveredVessel.route}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Speed:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{hoveredVessel.speed} knots</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>ETA:</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{hoveredVessel.eta}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>Payload:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{hoveredVessel.cargo}</span>
              </div>
            </div>
          </div>
        )}

        {hoveredPort && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(Math.max(tooltipPos.x + 12, 12), 450),
              top: Math.max(tooltipPos.y - 95, 10),
              zIndex: 30,
              pointerEvents: 'none',
              width: 190,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(2, 12, 28, 0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(6, 214, 199, 0.5)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#06d6c7' }}>{hoveredPort.name}</span>
              <span style={{ fontSize: 9, color: '#fff', fontFamily: 'monospace' }}>[{hoveredPort.id}]</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{hoveredPort.country}</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Yard Load:</span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>{hoveredPort.load}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 2 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Active Berths:</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>{hoveredPort.berths} operational</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Legend ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(2, 8, 20, 0.5)',
          fontSize: 10,
          color: 'rgba(255,255,255,0.45)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06d6c7' }} /> Normal Corridor
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> Congested Bottleneck
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /> Strategic Terminal
          </span>
        </div>
        <span>Hover vessel/port for real-time AIS telemetry</span>
      </div>
    </div>
  )
}
