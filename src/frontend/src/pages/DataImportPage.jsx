// ─────────────────────────────────────────────────────────────────────────────
// DataImportPage — CSV vessel data ingestion
// Parses, validates, previews, then POSTs each row to POST /api/vessels
// Uses existing vesselsApi.create() — no new API client.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from 'react'
import { SectionHeader } from '../components/GlassUI'
import { vesselsApi, importHistoryApi } from '../services/api'
import { useReschedule } from '../context/RescheduleContext'
import { useLanguage } from '../i18n/LanguageContext'

// ── Schema definition (mirrors VesselCreate / VesselBase) ────────────────────
const REQUIRED_COLS = ['imo_number', 'vessel_name', 'status']

const VALID_STATUSES = new Set(['active', 'en_route', 'berthed', 'delayed', 'inactive'])
const VALID_RISKS    = new Set(['low', 'medium', 'high'])

const NUMERIC_COLS   = ['length_m', 'draft_m', 'gross_tonnage', 'speed_knots', 'delay_hours']
const DATETIME_COLS  = ['scheduled_eta', 'predicted_eta']
const KNOWN_COLS = [
  'imo_number','vessel_name','vessel_type','flag_code',
  'length_m','draft_m','gross_tonnage',
  'status','current_location','speed_knots',
  'departure_port_code','arrival_port_code',
  'scheduled_eta','predicted_eta',
  'delay_hours','congestion_risk',
]

// ── CSV parser (no dependencies) ─────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const vals = line.split(',').map(v => v.trim())
    const obj  = {}
    headers.forEach((h, j) => { obj[h] = vals[j] ?? '' })
    rows.push({ _lineNum: i + 1, ...obj })
  }
  return { headers, rows }
}

// ── Validate a single row ─────────────────────────────────────────────────────
function validateRow(row, headers, imosSeen) {
  const errors = []

  // Required fields
  for (const col of REQUIRED_COLS) {
    if (!headers.includes(col)) continue  // column-level error handled separately
    const v = (row[col] ?? '').trim()
    if (!v) errors.push(`"${col}" is required`)
  }

  // status
  const st = (row.status ?? '').trim()
  if (st && !VALID_STATUSES.has(st)) {
    errors.push(`status "${st}" must be one of: active, en_route, berthed, delayed, inactive`)
  }

  // congestion_risk
  const cr = (row.congestion_risk ?? '').trim()
  if (cr && !VALID_RISKS.has(cr)) {
    errors.push(`congestion_risk "${cr}" must be: low, medium, or high`)
  }

  // IMO length
  const imo = (row.imo_number ?? '').trim()
  if (imo.length > 20) errors.push('imo_number exceeds 20 characters')
  if (imo.length > 0 && imo.length <= 20) {
    if (imosSeen.has(imo)) {
      errors.push(`duplicate imo_number "${imo}" within CSV`)
    } else {
      imosSeen.add(imo)
    }
  }

  // vessel_name length
  const vn = (row.vessel_name ?? '').trim()
  if (vn.length > 120) errors.push('vessel_name exceeds 120 characters')

  // Numeric fields
  for (const col of NUMERIC_COLS) {
    const v = (row[col] ?? '').trim()
    if (v === '') continue
    const n = Number(v)
    if (isNaN(n)) errors.push(`"${col}" must be numeric (got "${v}")`)
    else if (col !== 'delay_hours' && n <= 0) errors.push(`"${col}" must be > 0`)
    else if (col === 'delay_hours' && n < 0) errors.push(`"delay_hours" must be ≥ 0`)
  }

  // Datetime fields
  for (const col of DATETIME_COLS) {
    const v = (row[col] ?? '').trim()
    if (v === '') continue
    const d = new Date(v)
    if (isNaN(d.getTime())) errors.push(`"${col}" is not a valid date ("${v}")`)
  }

  return errors
}

// ── Build API payload from a CSV row ─────────────────────────────────────────
function buildPayload(row) {
  const obj = {}
  for (const col of KNOWN_COLS) {
    const v = (row[col] ?? '').trim()
    if (v === '') continue

    if (NUMERIC_COLS.includes(col)) {
      obj[col] = Number(v)
    } else if (DATETIME_COLS.includes(col)) {
      obj[col] = new Date(v).toISOString()
    } else {
      obj[col] = v
    }
  }
  // default status when not provided (shouldn't reach here after validation)
  if (!obj.status) obj.status = 'active'
  return obj
}

// ── Inline icon atoms ─────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 32, height: 32 }}>
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 104 16.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const CheckIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const XIcon = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
    <line x1="6"  y1="6" x2="18" y2="18" strokeLinecap="round"/>
  </svg>
)
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 15, height: 15 }}>
    <polyline points="8 17 12 21 16 17" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="12" x2="12" y2="21" strokeLinecap="round"/>
    <path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 104 16.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Status badge helper ───────────────────────────────────────────────────────
function PhaseBadge({ phase }) {
  const map = {
    idle:       { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', label: 'No file selected' },
    parsing:    { bg: 'rgba(6,214,199,0.12)',  color: '#06d6c7',               label: 'Parsing CSV…'      },
    valid:      { bg: 'rgba(16,185,129,0.12)', color: '#34d399',               label: 'Validation passed' },
    invalid:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171',               label: 'Validation errors' },
    importing:  { bg: 'rgba(6,214,199,0.12)',  color: '#06d6c7',               label: 'Importing…'        },
    success:    { bg: 'rgba(16,185,129,0.12)', color: '#34d399',               label: 'Import complete'   },
    partial:    { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24',               label: 'Partial import'    },
    error:      { bg: 'rgba(239,68,68,0.12)',  color: '#f87171',               label: 'Backend error'     },
  }
  const s = map[phase] ?? map.idle
  return (
    <span style={{
      display:        'inline-flex', alignItems: 'center',
      padding:        '3px 10px', borderRadius: 20,
      fontSize:       11, fontWeight: 600,
      background:     s.bg, color: s.color,
      border:         `1px solid ${s.color}44`,
    }}>
      {s.label}
    </span>
  )
}

// ── DataImportPage ────────────────────────────────────────────────────────────
export default function DataImportPage() {
  const { openReschedule } = useReschedule()
  const { t } = useLanguage()
  const [phase,       setPhase]       = useState('idle')      // idle|parsing|valid|invalid|importing|success|partial|error
  const [file,        setFile]        = useState(null)        // File object
  const [headers,     setHeaders]     = useState([])          // parsed CSV headers
  const [parsedRows,  setParsedRows]  = useState([])          // all data rows
  const [rowErrors,   setRowErrors]   = useState({})          // { lineNum: [errors] }
  const [columnErrs,  setColumnErrs]  = useState([])          // missing required column errors
  const [imported,    setImported]    = useState(0)
  const [skipped,     setSkipped]     = useState([])          // { lineNum, imo, reason }
  const [total,       setTotal]       = useState(0)
  const [isDragOver,  setIsDragOver]  = useState(false)
  const fileInputRef  = useRef(null)

  // ── Persistent import history ───────────────────────────────────────────────
  const [history,      setHistory]      = useState([])
  const [historyError, setHistoryError] = useState(null)

  useEffect(() => {
    let cancelled = false
    importHistoryApi.list()
      .then(d  => { if (!cancelled) setHistory(d) })
      .catch(() => { if (!cancelled) setHistoryError('Could not load import history.') })
    return () => { cancelled = true }
  }, [])

  // ── Shared validation runner ────────────────────────────────────────────────
  const runValidation = useCallback((hdrs, rows) => {
    // Column-level checks
    const colErrs = REQUIRED_COLS
      .filter(c => !hdrs.includes(c))
      .map(c => `Missing required column: "${c}"`)

    // Row-level checks
    const imosSeen = new Set()
    const errMap   = {}
    for (const row of rows) {
      const errs = validateRow(row, hdrs, imosSeen)
      if (errs.length > 0) errMap[row._lineNum] = errs
    }

    setColumnErrs(colErrs)
    setRowErrors(errMap)

    const hasErrors = colErrs.length > 0 || Object.keys(errMap).length > 0
    setPhase(hasErrors ? 'invalid' : 'valid')
  }, [])

  // ── File ingestion ──────────────────────────────────────────────────────────
  const processFile = useCallback((f) => {
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setColumnErrs(['File must be a .csv'])
      setPhase('invalid')
      return
    }
    setFile(f)
    setPhase('parsing')
    setImported(0)
    setSkipped([])
    setTotal(0)

    const reader = new FileReader()
    reader.onload = (e) => {
      const { headers: hdrs, rows } = parseCSV(e.target.result)
      setHeaders(hdrs)
      setParsedRows(rows)
      setTotal(rows.length)
      runValidation(hdrs, rows)
    }
    reader.readAsText(f)
  }, [runValidation])

  const handleFileInput = (e) => processFile(e.target.files?.[0])
  const handleDrop      = (e) => { e.preventDefault(); setIsDragOver(false); processFile(e.dataTransfer.files?.[0]) }
  const handleDragOver  = (e) => { e.preventDefault(); setIsDragOver(true)  }
  const handleDragLeave = ()  => setIsDragOver(false)

  const clearFile = () => {
    setFile(null); setHeaders([]); setParsedRows([]); setRowErrors({})
    setColumnErrs([]); setPhase('idle'); setImported(0); setSkipped([]); setTotal(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Import handler ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (phase !== 'valid') return

    const validRows = parsedRows.filter(r => !rowErrors[r._lineNum])
    setPhase('importing')
    setImported(0)
    setSkipped([])

    let importedCount = 0
    const skippedList = []

    for (const row of validRows) {
      const payload = buildPayload(row)
      try {
        await vesselsApi.create(payload)
        importedCount++
        setImported(importedCount)
      } catch (err) {
        const detail = err?.response?.data?.detail ?? err?.message ?? 'Unknown error'
        skippedList.push({ lineNum: row._lineNum, imo: row.imo_number, reason: detail })
        setSkipped([...skippedList])
      }
    }

    // Add invalid rows to skipped list too
    for (const row of parsedRows) {
      if (rowErrors[row._lineNum]) {
        skippedList.push({
          lineNum: row._lineNum,
          imo:     row.imo_number,
          reason:  rowErrors[row._lineNum].join('; '),
        })
      }
    }

    setSkipped([...skippedList])
    const finalPhase = skippedList.length === 0 ? 'success' : importedCount > 0 ? 'partial' : 'error'
    setPhase(finalPhase)

    // ── Persist import record to backend ────────────────────────────────────
    const totalRows   = parsedRows.length
    const skippedRows = skippedList.length
    try {
      const record = await importHistoryApi.create({
        filename:      file?.name ?? 'unknown.csv',
        total_rows:    totalRows,
        imported_rows: importedCount,
        skipped_rows:  skippedRows,
        status:        finalPhase === 'error' ? 'error' : finalPhase === 'partial' ? 'partial' : 'success',
        skip_details:  skippedList.length > 0 ? skippedList : null,
      })
      setHistory(prev => [record, ...prev])
    } catch (_) {
      // History save failure is non-fatal — import already completed
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const validRowCount   = parsedRows.filter(r => !rowErrors[r._lineNum]).length
  const invalidRowCount = Object.keys(rowErrors).length
  const previewRows     = parsedRows.slice(0, 5)

  // ── Glass style helper ──────────────────────────────────────────────────────
  const glass = (extra = {}) => ({
    background:           'rgba(255,255,255,0.06)',
    backdropFilter:       'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border:               '1px solid rgba(255,255,255,0.12)',
    borderRadius:          14,
    ...extra,
  })

  const darkGlass = (extra = {}) => ({
    background:           'rgba(8,30,55,0.30)',
    backdropFilter:       'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border:               '1px solid rgba(6,214,199,0.15)',
    borderRadius:          14,
    ...extra,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, animation: 'kpi-enter 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, marginBottom: 6 }}>
            Import Vessel Data
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', margin: 0 }}>
            Upload vessel records to populate the live fleet database. Records are validated before import.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PhaseBadge phase={phase} />
          {/* Download sample CSV */}
          <a
            href="/portmind_demo_vessels.csv"
            download="portmind_demo_vessels.csv"
            style={{
              display:        'inline-flex', alignItems: 'center', gap: 7,
              height:         36, paddingInline: 14, borderRadius: 10,
              background:     'rgba(6,214,199,0.10)', border: '1px solid rgba(6,214,199,0.28)',
              color:          '#06d6c7', fontSize: 12, fontWeight: 600,
              textDecoration: 'none', transition: 'background 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,214,199,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,214,199,0.10)'}
          >
            <DownloadIcon /> Download Sample CSV
          </a>
        </div>
      </div>

      {/* ── Drop zone ── */}
      {phase === 'idle' || phase === 'parsing' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            ...glass(),
            padding:        '40px 24px',
            display:        'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            cursor:         'pointer',
            border:         isDragOver
              ? '1.5px dashed rgba(6,214,199,0.70)'
              : '1.5px dashed rgba(255,255,255,0.18)',
            borderRadius:   18,
            transition:     'border-color 0.18s, background 0.18s',
            background:     isDragOver ? 'rgba(6,214,199,0.05)' : 'rgba(255,255,255,0.04)',
          }}
        >
          <div style={{ color: isDragOver ? '#06d6c7' : 'rgba(255,255,255,0.35)', transition: 'color 0.18s' }}>
            <UploadIcon />
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', fontWeight: 500, margin: 0 }}>
            Drag and drop a CSV file here, or click to browse
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', margin: 0 }}>
            Accepted format: .csv · Required columns: imo_number, vessel_name, status
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        /* ── File selected bar ── */
        <div style={{ ...glass(), padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* File icon */}
          <div style={{
            width: 38, height: 38, borderRadius: 9, flexShrink: 0,
            background: 'rgba(6,214,199,0.12)', border: '1px solid rgba(6,214,199,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#06d6c7" strokeWidth="1.8" style={{ width: 18, height: 18 }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13" strokeLinecap="round"/>
              <line x1="8" y1="17" x2="12" y2="17" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file?.name}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: '2px 0 0' }}>
              {file ? `${(file.size / 1024).toFixed(1)} KB` : ''} · {total} rows detected
            </p>
          </div>
          {/* Clear button */}
          <button
            onClick={clearFile}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.20)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.10)'}
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* ── Validation summary ── */}
      {file && phase !== 'parsing' && phase !== 'idle' && (
        <div style={{ ...darkGlass(), padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Validation</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>
                Columns detected: <b style={{ color: '#fff' }}>{headers.length}</b>
              </span>
              <span style={{ fontSize: 12, color: '#34d399' }}>
                Valid rows: <b>{validRowCount}</b>
              </span>
              {invalidRowCount > 0 && (
                <span style={{ fontSize: 12, color: '#f87171' }}>
                  Rows with errors: <b>{invalidRowCount}</b>
                </span>
              )}
            </div>
          </div>

          {/* Column errors */}
          {columnErrs.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px',
              background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)',
              borderRadius: 8,
            }}>
              <XIcon size={13} /><span style={{ fontSize: 12, color: '#f87171' }}>{e}</span>
            </div>
          ))}

          {/* All-good message */}
          {columnErrs.length === 0 && invalidRowCount === 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
              background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.22)',
              borderRadius: 8,
            }}>
              <CheckIcon size={13} />
              <span style={{ fontSize: 12, color: '#34d399' }}>
                All {validRowCount} rows passed validation. Ready to import.
              </span>
            </div>
          )}

          {/* Row errors (collapsed to first 8) */}
          {invalidRowCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 220, overflowY: 'auto' }}>
              {Object.entries(rowErrors).slice(0, 8).map(([lineNum, errs]) => (
                <div key={lineNum} style={{
                  padding: '8px 12px', background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>Row {lineNum}: </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>{errs.join(' · ')}</span>
                </div>
              ))}
              {invalidRowCount > 8 && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, paddingLeft: 4 }}>
                  …and {invalidRowCount - 8} more row error{invalidRowCount - 8 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── CSV Preview (first 5 rows) ── */}
      {parsedRows.length > 0 && phase !== 'parsing' && (
        <div style={{ ...glass(), overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              Preview — first {Math.min(5, parsedRows.length)} of {parsedRows.length} rows
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em', fontSize: 10, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    ROW
                  </th>
                  {headers.map(h => (
                    <th key={h} style={{
                      padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap',
                      borderBottom: '1px solid rgba(255,255,255,0.07)',
                      color: REQUIRED_COLS.includes(h) ? '#06d6c7' : 'rgba(255,255,255,0.35)',
                      fontWeight: 600, letterSpacing: '0.06em', fontSize: 10,
                    }}>
                      {h.toUpperCase()}{REQUIRED_COLS.includes(h) ? ' *' : ''}
                    </th>
                  ))}
                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.06em', fontSize: 10, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map(row => {
                  const errs = rowErrors[row._lineNum]
                  return (
                    <tr key={row._lineNum} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '7px 10px', color: 'rgba(255,255,255,0.30)', fontFamily: 'monospace' }}>
                        {row._lineNum}
                      </td>
                      {headers.map(h => (
                        <td key={h} style={{
                          padding: '7px 10px', whiteSpace: 'nowrap',
                          color: (row[h] ?? '') === '' ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.78)',
                          maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {(row[h] ?? '') || <span style={{ fontStyle: 'italic' }}>—</span>}
                        </td>
                      ))}
                      <td style={{ padding: '7px 10px' }}>
                        {errs
                          ? <span style={{ color: '#f87171', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}><XIcon size={11}/> {errs.length} error{errs.length > 1 ? 's' : ''}</span>
                          : <span style={{ color: '#34d399', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}><CheckIcon size={11}/> OK</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Import button ── */}
      {(phase === 'valid' || phase === 'importing') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={handleImport}
            disabled={phase === 'importing'}
            style={{
              display:       'inline-flex', alignItems: 'center', gap: 9,
              height:         46, paddingInline: 28, borderRadius: 12,
              border:         'none', cursor: phase === 'importing' ? 'not-allowed' : 'pointer',
              fontFamily:     'inherit', fontSize: 14, fontWeight: 700,
              color:          '#020d1e',
              background:     phase === 'importing'
                ? 'rgba(6,214,199,0.50)'
                : 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
              boxShadow:      phase === 'importing' ? 'none' : '0 0 22px rgba(6,214,199,0.40)',
              transition:     'opacity 0.2s',
              opacity:        phase === 'importing' ? 0.75 : 1,
            }}
          >
            {phase === 'importing' ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="9" strokeOpacity="0.25"/>
                  <path d="M12 3a9 9 0 019 9" strokeLinecap="round"/>
                </svg>
                Importing {imported} / {validRowCount}…
              </>
            ) : (
              <>
                <CheckIcon size={15} />
                Import {validRowCount} Vessel{validRowCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
          {phase === 'valid' && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>
              {invalidRowCount > 0 && `${invalidRowCount} invalid row${invalidRowCount > 1 ? 's' : ''} will be skipped · `}
              Import will call POST /api/vessels for each valid row.
            </span>
          )}
        </div>
      )}

      {/* ── Import result ── */}
      {(phase === 'success' || phase === 'partial' || phase === 'error') && (
        <div style={{
          ...darkGlass(),
          padding: '18px 20px',
          border: phase === 'success'
            ? '1px solid rgba(16,185,129,0.28)'
            : phase === 'partial'
              ? '1px solid rgba(245,158,11,0.28)'
              : '1px solid rgba(239,68,68,0.28)',
        }}>
          {/* Result header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {phase === 'success'
              ? <CheckIcon size={18} />
              : phase === 'partial'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round"/></svg>
                : <XIcon size={18} />
            }
            <span style={{
              fontSize: 14, fontWeight: 700,
              color: phase === 'success' ? '#34d399' : phase === 'partial' ? '#fbbf24' : '#f87171',
            }}>
              {phase === 'success' && 'Import complete'}
              {phase === 'partial' && 'Partial import'}
              {phase === 'error'   && 'Import failed'}
            </span>
          </div>

          {/* Counts */}
          <div style={{ display: 'flex', gap: 24, marginBottom: skipped.length > 0 ? 14 : 0 }}>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Imported</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#34d399', margin: 0, lineHeight: 1 }}>{imported}</p>
            </div>
            {skipped.length > 0 && (
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px' }}>Skipped</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#f87171', margin: 0, lineHeight: 1 }}>{skipped.length}</p>
              </div>
            )}
          </div>

          {/* Skip reasons */}
          {skipped.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
              {skipped.map((s, i) => (
                <div key={i} style={{
                  padding: '6px 10px', background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.14)', borderRadius: 7,
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.50)' }}>
                    Row {s.lineNum}{s.imo ? ` · IMO ${s.imo}` : ''}:{' '}
                  </span>
                  <span style={{ fontSize: 11, color: '#f87171' }}>{s.reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Post-import hint */}
          {imported > 0 && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 12, marginBottom: 0 }}>
              Vessels are now available in the Fleet dashboard and on the Vessels page.
            </p>
          )}

          {/* Post-import prompt banner for high congestion risk */}
          {imported > 0 && (() => {
            const highRiskRow = parsedRows.find(r => !rowErrors[r._lineNum] && (r.congestion_risk === 'high' || Number(r.delay_hours) > 3))
            if (!highRiskRow) return null
            return (
              <div style={{
                marginTop: 16,
                padding: '14px 18px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>
                      Congestion risk detected for {highRiskRow.vessel_name}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)' }}>
                      {t('reschedule_prompt_banner', 'Congestion risk detected. Would you like PortMind to generate an optimized 72-hour rescheduling plan?')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openReschedule(1, highRiskRow.vessel_name)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #06d6c7 0%, #0891b2 100%)',
                    border: 'none',
                    color: '#020d1e',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 0 12px rgba(6, 214, 199, 0.35)',
                  }}
                >
                  ⚡ {t('reschedule_generate_plan', 'Generate Reschedule Plan')}
                </button>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── New Import button (shown after a completed import) ── */}
      {(phase === 'success' || phase === 'partial' || phase === 'error') && (
        <div>
          <button
            onClick={clearFile}
            style={{
              display:       'inline-flex', alignItems: 'center', gap: 9,
              height:         42, paddingInline: 22, borderRadius: 10,
              border:         '1px solid rgba(6,214,199,0.35)', cursor: 'pointer',
              fontFamily:     'inherit', fontSize: 13, fontWeight: 600,
              color:          '#06d6c7', background: 'rgba(6,214,199,0.08)',
              transition:     'background 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,214,199,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(6,214,199,0.08)'}
          >
            <UploadIcon />
            New Import
          </button>
        </div>
      )}

      {/* ── Import History ── */}
      {(history.length > 0 || historyError) && (
        <div style={{ marginTop: 8 }}>
          <SectionHeader title="Import History" />
          {historyError && (
            <p style={{ fontSize: 12, color: 'rgba(239,68,68,0.75)', marginBottom: 8 }}>{historyError}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(h => {
              const statusColor =
                h.status === 'success' ? '#34d399' :
                h.status === 'partial' ? '#fbbf24' : '#f87171'
              const statusBg =
                h.status === 'success' ? 'rgba(16,185,129,0.09)' :
                h.status === 'partial' ? 'rgba(245,158,11,0.09)' : 'rgba(239,68,68,0.09)'
              const statusBorder =
                h.status === 'success' ? 'rgba(16,185,129,0.22)' :
                h.status === 'partial' ? 'rgba(245,158,11,0.22)' : 'rgba(239,68,68,0.22)'
              const when = new Date(h.imported_at).toLocaleString(undefined, {
                dateStyle: 'medium', timeStyle: 'short',
              })
              return (
                <div key={h.id} style={{
                  background: statusBg,
                  border: `1px solid ${statusBorder}`,
                  borderRadius: 12, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12,
                }}>
                  {/* File icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  {/* Filename + date */}
                  <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.filename}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', margin: '2px 0 0' }}>{when}</p>
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 18, flexShrink: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Total</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1 }}>{h.total_rows}</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Imported</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#34d399', margin: 0, lineHeight: 1 }}>{h.imported_rows}</p>
                    </div>
                    {h.skipped_rows > 0 && (
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Skipped</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#f87171', margin: 0, lineHeight: 1 }}>{h.skipped_rows}</p>
                      </div>
                    )}
                  </div>
                  {/* Status badge */}
                  <span style={{
                    flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: statusColor,
                    background: statusBg, border: `1px solid ${statusBorder}`,
                    padding: '3px 9px', borderRadius: 20,
                  }}>
                    {h.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Spin keyframe ── */}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
