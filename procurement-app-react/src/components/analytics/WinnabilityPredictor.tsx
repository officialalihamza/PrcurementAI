import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Paper, Chip, LinearProgress, Slider, FormControlLabel,
  Checkbox, Tooltip, CircularProgress, Divider, IconButton, Collapse,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import SaveOutlinedIcon          from '@mui/icons-material/SaveOutlined'
import SearchOutlinedIcon        from '@mui/icons-material/SearchOutlined'
import InfoOutlinedIcon          from '@mui/icons-material/InfoOutlined'
import CheckCircleOutlinedIcon   from '@mui/icons-material/CheckCircleOutlined'
import WarningAmberOutlinedIcon  from '@mui/icons-material/WarningAmberOutlined'
import LightbulbOutlinedIcon     from '@mui/icons-material/LightbulbOutlined'
import PersonOutlinedIcon        from '@mui/icons-material/PersonOutlined'
import ExpandMoreIcon            from '@mui/icons-material/ExpandMore'
import ExpandLessIcon            from '@mui/icons-material/ExpandLess'
import { barriersApi } from '../../services/api'
import { useCompanyStore } from '../../store/companyStore'
import { useNavigate } from 'react-router-dom'
import type { WinnabilityResult } from '../../types'

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTORS = [
  'IT Services', 'Construction', 'R&D Services', 'Health Services',
  'Architecture & Engineering', 'Education', 'Environmental Services',
  'Business Services', 'Transport', 'Financial Services', 'Software',
  'Community Services', 'Medical Equipment', 'Public Administration',
]
const REGIONS = [
  'London', 'South East', 'North West', 'Yorkshire and the Humber',
  'West Midlands', 'East of England', 'Scotland', 'Wales',
  'North East', 'East Midlands', 'South West', 'Northern Ireland',
]
const AUTH_TYPES = [
  'Local Government', 'Education', 'Other Public Sector',
  'NHS', 'Emergency Services', 'Central Government',
]

// ─── Keyword patterns for requirement detection ───────────────────────────────

const REQUIREMENT_PATTERNS: Record<string, { patterns: RegExp[]; label: string }> = {
  framework:             { label: 'Framework agreement route',    patterns: [/framework\s+agreement/i, /\bframework\b/i, /call[\s-]off/i] },
  certification:         { label: 'ISO 9001 required',            patterns: [/iso[\s-]?9001/i, /quality\s+management\s+system/i, /\bqms\b/i] },
  requires_iso27001:     { label: 'ISO 27001 required',           patterns: [/iso[\s-]?27001/i, /information\s+security/i, /isms/i] },
  requires_cyber_ess:    { label: 'Cyber Essentials required',    patterns: [/cyber\s+essentials/i, /\bce\+?\b.*certif/i] },
  requires_security:     { label: 'Security clearance (SC/DV)',   patterns: [/security\s+clearance/i, /\bsc\s+cleared/i, /\bdv\s+cleared/i, /baseline\s+personnel/i] },
  incumbent_language:    { label: 'Incumbent supplier signals',   patterns: [/proven\s+track\s+record/i, /existing\s+supplier/i, /current\s+provider/i, /continuation\s+of/i, /experience\s+of\s+delivering/i] },
  requires_social_value: { label: 'Social value requirement',     patterns: [/social\s+value/i, /community\s+benefit/i, /local\s+employment/i, /apprenticeship/i] },
  requires_gdpr:         { label: 'GDPR / data protection',       patterns: [/gdpr/i, /data\s+protection\s+act/i, /personal\s+data/i, /data\s+processor/i] },
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 65) return { text: '#155724', bg: '#d4edda', border: '#86efac', gauge: '#16a34a' }
  if (pct >= 45) return { text: '#856404', bg: '#fff3cd', border: '#fde68a', gauge: '#d97706' }
  return              { text: '#721C24', bg: '#f8d7da', border: '#fca5a5', gauge: '#dc2626' }
}

// ─── Client-side live estimate ────────────────────────────────────────────────

function liveEstimate(form: FormState, company: Record<string, unknown> | null): number {
  let s = 42 // baseline %

  // Sector match
  const sectors = (company?.primary_sectors as string[] | undefined) ?? []
  if (form.sector && sectors.includes(form.sector)) s += 14
  else if (form.sector && sectors.length > 0)         s -= 6

  // Turnover vs value
  const turnover = (company?.turnover_latest as number | undefined) ?? (company?.turnover as number | undefined) ?? 0
  if (turnover && form.value) {
    const r = form.value / turnover
    if (r <= 0.25)          s += 12
    else if (r <= 0.50)     s += 5
    else if (r <= 1.00)     s -= 6
    else                    s -= 14
  }

  // Timeline
  if (form.timeline_days < 21) s -= 8
  else if (form.timeline_days > 90) s += 4

  // Complexity (high complexity = lower score)
  s -= Math.round(form.complexity * 0.10)

  // Team capacity
  s += Math.round(form.team_capacity * 0.08)

  // Requirements
  if (form.framework)          s -= 4
  if (form.incumbent_language) s -= 10
  if (form.certification) {
    s += (company?.has_iso_9001 ? 5 : -5)
  }
  if (form.requires_iso27001) {
    s += (company?.has_iso_27001 ? 5 : -5)
  }
  if (form.requires_cyber_ess) {
    s += (company?.has_cyber_essentials ? 4 : -4)
  }
  if (form.requires_security) s -= 6
  if (form.requires_social_value) s -= 2
  if (form.requires_gdpr) {
    s += (company?.has_gdpr_docs ? 4 : -3)
  }

  // Experience
  const exp = (company?.years_public_sector as number | undefined) ?? 0
  if (exp >= 5) s += 6
  else if (exp === 0) s -= 4

  // Region match
  const companyRegion = ((company?.region as string | undefined) ?? '').toLowerCase()
  const formRegion    = form.region.toLowerCase()
  if (companyRegion && formRegion && companyRegion === formRegion) s += 6
  else if ((company?.geographic_coverage as string | undefined) === 'national') s += 4

  return Math.max(5, Math.min(97, s))
}

// ─── Live insight generator ───────────────────────────────────────────────────

function liveInsights(form: FormState, company: Record<string, unknown> | null, pct: number) {
  const strengths: string[] = []
  const gaps: string[]      = []
  let recommendation = ''

  const sectors   = (company?.primary_sectors as string[] | undefined) ?? []
  const turnover  = (company?.turnover_latest as number | undefined) ?? (company?.turnover as number | undefined) ?? 0
  const employees = (company?.employees as number | undefined) ?? 0
  const exp       = (company?.years_public_sector as number | undefined) ?? 0

  // Sector
  if (form.sector && sectors.includes(form.sector))
    strengths.push(`${form.sector} is in your registered sectors — strong alignment`)
  else if (form.sector && sectors.length > 0)
    gaps.push(`${form.sector} is outside your usual sectors — buyers may question capability`)

  // Financial
  if (turnover && form.value) {
    const r = form.value / turnover
    if (r <= 0.25)       strengths.push('Contract value is well-proportioned to your turnover')
    else if (r <= 0.50)  strengths.push('Contract value is manageable relative to turnover')
    else if (r > 1.0)    gaps.push('Contract value exceeds your annual turnover — significant financial risk')
    else                 gaps.push('Contract value is high relative to turnover — consortium may help')
  } else if (!turnover) {
    gaps.push('Turnover not set in your profile — update it to improve accuracy')
  }

  // Team capacity
  if (form.team_capacity >= 70) strengths.push('Good team capacity available for this bid')
  else if (form.team_capacity < 30) gaps.push('Low team capacity may affect delivery credibility')

  // Experience
  if (exp >= 5)         strengths.push(`${exp} years of public sector experience is a strong advantage`)
  else if (exp === 0)   gaps.push('No public sector experience recorded — build case studies first')

  // Certs vs requirements
  if (form.certification && !company?.has_iso_9001)
    gaps.push('ISO 9001 required but not in your profile — consider obtaining it')
  if (form.requires_iso27001 && !company?.has_iso_27001)
    gaps.push('ISO 27001 required — this is a hard requirement for IT contracts')
  if (form.requires_cyber_ess && !company?.has_cyber_essentials)
    gaps.push('Cyber Essentials certification required but missing from profile')

  // Incumbent
  if (form.incumbent_language)
    gaps.push('Specification shows incumbent supplier signals — harder for new entrants')

  // Framework
  if (form.framework && employees < 10)
    gaps.push('Framework routes often favour established suppliers with track records')

  // Region
  const companyRegion = ((company?.region as string | undefined) ?? '').toLowerCase()
  if (form.region && companyRegion === form.region.toLowerCase())
    strengths.push(`Contract is in your home region (${form.region})`)

  // Complexity
  if (form.complexity >= 70) gaps.push('High complexity contracts increase delivery risk for SMEs')
  else if (form.complexity <= 30) strengths.push('Low complexity is well-suited to smaller teams')

  // Recommendation
  if (pct >= 65) {
    recommendation = `This looks like a strong opportunity. Prepare a tailored bid focusing on your ${sectors[0] ?? 'core'} experience and direct sector alignment.`
  } else if (pct >= 45) {
    recommendation = gaps.length > 0
      ? `Address the gaps below before bidding — especially ${gaps[0].split(' ').slice(0, 5).join(' ')}…`
      : 'A reasonable opportunity — strengthen your bid with case studies and certifications.'
  } else {
    recommendation = 'High barriers detected. Consider whether a consortium arrangement or sub-contracting role would be a better entry point for this contract.'
  }

  return {
    strengths:      strengths.slice(0, 3),
    gaps:           gaps.slice(0, 3),
    recommendation,
  }
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────

function GaugeSVG({ pct, color, animated = true }: { pct: number; color: string; animated?: boolean }) {
  const FULL_ARC = 251.3   // half-circle circumference (π × r=80)
  const dashLen  = (pct / 100) * FULL_ARC
  const angle    = Math.PI - (pct / 100) * Math.PI
  const x2 = 120 + 84 * Math.cos(angle)
  const y2 = 105 - 84 * Math.sin(angle)

  return (
    <svg viewBox="0 0 240 120" style={{ width: '100%', maxWidth: 260, height: 'auto' }}>
      {/* Track */}
      <path d="M 15 105 A 105 105 0 0 1 225 105" fill="none" stroke="#e8edf3" strokeWidth="16" strokeLinecap="round" />
      {/* Colored arc */}
      <path d="M 15 105 A 105 105 0 0 1 225 105" fill="none"
        stroke={color} strokeWidth="16" strokeLinecap="round"
        strokeDasharray={`${dashLen} ${FULL_ARC}`}
        style={animated ? { transition: 'stroke-dasharray 0.6s ease' } : undefined}
      />
      {/* Zone ticks */}
      <text x="10"  y="116" fontSize="8" fill="#9ca3af">0</text>
      <text x="104" y="12"  fontSize="8" fill="#9ca3af" textAnchor="middle">50%</text>
      <text x="222" y="116" fontSize="8" fill="#9ca3af" textAnchor="end">100</text>
      {/* Needle */}
      <line x1="120" y1="105" x2={x2} y2={y2} stroke="#374151" strokeWidth="2.5" strokeLinecap="round"
        style={animated ? { transition: 'x2 0.6s ease, y2 0.6s ease' } : undefined} />
      <circle cx="120" cy="105" r="5" fill="#374151" />
    </svg>
  )
}

// ─── Insight card ─────────────────────────────────────────────────────────────

function InsightCard({
  icon, title, items, borderColor, bgColor, iconColor, single,
}: {
  icon: React.ReactNode; title: string; items: string[]; borderColor: string
  bgColor: string; iconColor: string; single?: boolean
}) {
  if (single) {
    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: bgColor }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
          <Box sx={{ color: iconColor, display: 'flex' }}>{icon}</Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: iconColor }}>{title}</Typography>
        </Box>
        <Typography sx={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6 }}>{items[0] ?? '—'}</Typography>
      </Paper>
    )
  }
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${borderColor}`, bgcolor: bgColor }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
        <Box sx={{ color: iconColor, display: 'flex' }}>{icon}</Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: iconColor }}>{title}</Typography>
      </Box>
      {items.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>None detected</Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          {items.map((item, i) => (
            <Box component="li" key={i} sx={{ fontSize: 12.5, color: '#374151', lineHeight: 1.7 }}>{item}</Box>
          ))}
        </Box>
      )}
    </Paper>
  )
}

// ─── Form state type ──────────────────────────────────────────────────────────

interface FormState {
  sector: string
  region: string
  authority_type: string
  value: number
  timeline_days: number
  complexity: number
  team_capacity: number
  contract_text: string
  framework: boolean
  certification: boolean
  incumbent_language: boolean
  requires_iso27001: boolean
  requires_cyber_ess: boolean
  requires_security: boolean
  requires_social_value: boolean
  requires_gdpr: boolean
}

const DEFAULT_FORM: FormState = {
  sector: '', region: '', authority_type: 'Local Government',
  value: 250000, timeline_days: 60,
  complexity: 40, team_capacity: 60,
  contract_text: '',
  framework: false, certification: false, incumbent_language: false,
  requires_iso27001: false, requires_cyber_ess: false,
  requires_security: false, requires_social_value: false, requires_gdpr: false,
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WinnabilityPredictor() {
  const navigate       = useNavigate()
  const { company }    = useCompanyStore()
  const [form, setForm] = useState<FormState>(() => {
    if (!company) return DEFAULT_FORM
    return {
      ...DEFAULT_FORM,
      sector:         ((company.primary_sectors as string[] | undefined)?.[0] ?? ''),
      region:         (company.region as string | undefined) ?? '',
      authority_type: 'Local Government',
    }
  })
  const [result,   setResult]   = useState<WinnabilityResult | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [showText, setShowText] = useState(false)

  const setF = (k: keyof FormState, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  // ── Sync from company profile ──────────────────────────────────────────────
  useEffect(() => {
    if (!company) return
    setForm(f => ({
      ...f,
      sector: f.sector || ((company.primary_sectors as string[] | undefined)?.[0] ?? ''),
      region: f.region || ((company.region as string | undefined) ?? ''),
    }))
  }, [company])

  // ── Parse contract text for requirements ───────────────────────────────────
  useEffect(() => {
    if (!form.contract_text) return
    const text = form.contract_text
    const updates: Partial<FormState> = {}
    for (const [key, { patterns }] of Object.entries(REQUIREMENT_PATTERNS)) {
      const detected = patterns.some(p => p.test(text))
      if (detected) updates[key as keyof FormState] = true as never
    }
    if (Object.keys(updates).length > 0) setForm(f => ({ ...f, ...updates }))
  }, [form.contract_text])

  // ── Live score estimate ────────────────────────────────────────────────────
  const livePct = useMemo(() => liveEstimate(form, company), [form, company])
  const liveCol = scoreColor(livePct)
  const insights = useMemo(() => liveInsights(form, company, livePct), [form, company, livePct])

  // Use API result if available, otherwise live estimate
  const displayPct  = result ? result.probability_pct : livePct
  const displayCol  = scoreColor(displayPct)
  const isEstimate  = !result

  // ── Predict (API call) ─────────────────────────────────────────────────────
  const predict = async () => {
    if (!form.sector) return
    setLoading(true)
    try {
      const payload = {
        sector: form.sector, region: form.region,
        authority_type: form.authority_type,
        value: form.value,
        timeline_days: form.timeline_days,
        complexity: form.complexity,
        team_capacity: form.team_capacity,
        framework: form.framework,
        certification: form.certification,
        incumbent_language: form.incumbent_language,
      }
      const { data } = await barriersApi.predictWinnability(payload as Record<string, unknown>)
      setResult(data)
    } catch {
      // keep live estimate on error
    }
    setLoading(false)
  }

  // ── Save assessment ────────────────────────────────────────────────────────
  const handleSave = () => {
    const saved = {
      timestamp: new Date().toISOString(),
      sector: form.sector, region: form.region,
      value: form.value, score: displayPct,
      insights,
    }
    localStorage.setItem('winnability_last', JSON.stringify(saved))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // ── View similar ───────────────────────────────────────────────────────────
  const handleViewSimilar = () => {
    const params = new URLSearchParams()
    if (form.sector) params.set('sector', form.sector)
    if (form.region) params.set('region', form.region)
    navigate(`/contracts?${params.toString()}`)
  }

  // ── Requirements checkboxes ────────────────────────────────────────────────
  const requirementKeys: Array<{ key: keyof FormState; label: string; tooltip: string }> = [
    { key: 'framework',          label: 'Framework route',         tooltip: 'Contract let via a pre-approved framework agreement' },
    { key: 'certification',      label: 'ISO 9001 required',       tooltip: 'Quality management system certification mandatory' },
    { key: 'requires_iso27001',  label: 'ISO 27001 required',      tooltip: 'Information security certification mandatory (common for IT)' },
    { key: 'requires_cyber_ess', label: 'Cyber Essentials',        tooltip: 'UK government cyber security baseline certification' },
    { key: 'requires_security',  label: 'Security clearance (SC)', tooltip: 'Staff need UK government security vetting' },
    { key: 'incumbent_language', label: 'Incumbent signals',       tooltip: 'Spec language that hints at a preferred existing supplier' },
    { key: 'requires_social_value', label: 'Social value req.',    tooltip: '5% weight given to social value under PPN 06/20' },
    { key: 'requires_gdpr',      label: 'GDPR / data processing',  tooltip: 'Contract involves processing personal data — DPA compliance needed' },
  ]

  const detectedKeys = useMemo(() => {
    const detected = new Set<string>()
    for (const [key, { patterns }] of Object.entries(REQUIREMENT_PATTERNS)) {
      if (patterns.some(p => p.test(form.contract_text))) detected.add(key)
    }
    return detected
  }, [form.contract_text])

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 420px' }, gap: 3, alignItems: 'start' }}>

      {/* ── LEFT: Form ───────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e8edf3' }}>

        {/* Profile pre-fill banner */}
        {company && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5,
            p: 1.25, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #dbeafe' }}>
            <PersonOutlinedIcon sx={{ fontSize: 16, color: '#2563eb' }} />
            <Typography sx={{ fontSize: 12, color: '#1d4ed8' }}>
              Pre-filled from your company profile ·{' '}
              <Box component="span" sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/profile-setup')}>
                Update profile
              </Box>
            </Typography>
          </Box>
        )}

        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5, color: '#1F3A5F' }}>
          Contract Parameters
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Sector + Region */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <FormControl size="small" fullWidth required>
              <InputLabel>CPV Sector *</InputLabel>
              <Select label="CPV Sector *" value={form.sector} onChange={e => { setF('sector', e.target.value); setResult(null) }} sx={{ fontSize: 13 }}>
                {SECTORS.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Region</InputLabel>
              <Select label="Region" value={form.region} onChange={e => { setF('region', e.target.value); setResult(null) }} sx={{ fontSize: 13 }}>
                <MenuItem value="" sx={{ fontSize: 13 }}>Any region</MenuItem>
                {REGIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Authority type + Value */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Authority Type</InputLabel>
              <Select label="Authority Type" value={form.authority_type} onChange={e => { setF('authority_type', e.target.value); setResult(null) }} sx={{ fontSize: 13 }}>
                {AUTH_TYPES.map(a => <MenuItem key={a} value={a} sx={{ fontSize: 13 }}>{a}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              label="Contract Value (£)" type="number" size="small" fullWidth
              value={form.value} onChange={e => { setF('value', Number(e.target.value)); setResult(null) }}
              sx={{ '& input': { fontSize: 13 } }}
            />
          </Box>

          {/* Timeline slider */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6C757D', mb: 0.5 }}>
              Timeline: <span style={{ color: '#1F3A5F' }}>{form.timeline_days} days</span> from publication
            </Typography>
            <Slider value={form.timeline_days} min={7} max={180} step={7}
              onChange={(_, v) => { setF('timeline_days', v); setResult(null) }}
              sx={{ color: '#2563eb' }}
              marks={[{ value: 30, label: '30d' }, { value: 60, label: '60d' }, { value: 120, label: '120d' }]}
            />
          </Box>

          {/* Complexity slider */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6C757D', mb: 0.5 }}>
              Contract Complexity:{' '}
              <span style={{ color: form.complexity >= 70 ? '#dc2626' : form.complexity >= 40 ? '#d97706' : '#16a34a' }}>
                {form.complexity < 35 ? 'Low' : form.complexity < 65 ? 'Medium' : 'High'} ({form.complexity})
              </span>
            </Typography>
            <Slider value={form.complexity} min={0} max={100} step={5}
              onChange={(_, v) => { setF('complexity', v); setResult(null) }}
              sx={{
                color: form.complexity >= 70 ? '#dc2626' : form.complexity >= 40 ? '#d97706' : '#16a34a',
              }}
              marks={[{ value: 0, label: 'Simple' }, { value: 50, label: 'Moderate' }, { value: 100, label: 'Complex' }]}
            />
          </Box>

          {/* Team Capacity slider */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6C757D', mb: 0.5 }}>
              Team Capacity:{' '}
              <span style={{ color: form.team_capacity >= 60 ? '#16a34a' : form.team_capacity >= 30 ? '#d97706' : '#dc2626' }}>
                {form.team_capacity < 35 ? 'Stretched' : form.team_capacity < 65 ? 'Available' : 'Ample'} ({form.team_capacity}%)
              </span>
            </Typography>
            <Slider value={form.team_capacity} min={0} max={100} step={5}
              onChange={(_, v) => { setF('team_capacity', v); setResult(null) }}
              sx={{
                color: form.team_capacity >= 60 ? '#16a34a' : form.team_capacity >= 30 ? '#d97706' : '#dc2626',
              }}
              marks={[{ value: 0, label: '0%' }, { value: 50, label: '50%' }, { value: 100, label: '100%' }]}
            />
          </Box>

          <Divider />

          {/* Contract text parser */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1F3A5F' }}>
                Auto-detect Requirements
              </Typography>
              <Button size="small" onClick={() => setShowText(o => !o)}
                endIcon={showText ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
                sx={{ fontSize: 11, textTransform: 'none', color: '#2563eb' }}>
                {showText ? 'Hide' : 'Paste contract text'}
              </Button>
            </Box>
            <Collapse in={showText}>
              <TextField
                multiline rows={4} fullWidth size="small"
                placeholder="Paste contract specification or ITT text here — requirements will be auto-detected…"
                value={form.contract_text}
                onChange={e => setF('contract_text', e.target.value)}
                sx={{ mb: 1.5, '& textarea': { fontSize: 12 } }}
              />
            </Collapse>
          </Box>

          {/* Requirements checkboxes */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#6C757D', mb: 1 }}>
              Contract Requirements
              {detectedKeys.size > 0 && (
                <Chip label={`${detectedKeys.size} auto-detected`} size="small"
                  sx={{ ml: 1, fontSize: 10, height: 18, bgcolor: '#dbeafe', color: '#1d4ed8' }} />
              )}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.25 }}>
              {requirementKeys.map(({ key, label, tooltip }) => {
                const isDetected = detectedKeys.has(key)
                return (
                  <Tooltip key={key} title={tooltip} placement="top" arrow>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={form[key] as boolean}
                          onChange={e => { setF(key, e.target.checked); setResult(null) }}
                          sx={{ py: 0.5,
                            '&.Mui-checked': { color: isDetected ? '#2563eb' : '#374151' },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{ fontSize: 12, color: '#374151' }}>{label}</Typography>
                          {isDetected && (
                            <Chip label="detected" size="small"
                              sx={{ fontSize: 9, height: 14, bgcolor: '#dbeafe', color: '#1d4ed8', px: 0 }} />
                          )}
                        </Box>
                      }
                    />
                  </Tooltip>
                )
              })}
            </Box>
          </Box>

          {/* Predict button */}
          <Button
            variant="contained" fullWidth size="large"
            onClick={predict} disabled={loading || !form.sector}
            sx={{ mt: 0.5, py: 1.5, fontWeight: 700, fontSize: 14, borderRadius: 2,
              bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' },
              boxShadow: '0 4px 14px rgba(29,78,216,0.35)' }}
          >
            {loading
              ? <><CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} /> Predicting…</>
              : '▶  Run Full Prediction'}
          </Button>
          {!form.sector && (
            <Typography sx={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', mt: -1.5 }}>
              Select a sector to continue
            </Typography>
          )}
        </Box>
      </Paper>

      {/* ── RIGHT: Live Gauge + Insights ────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Score gauge */}
        <Paper elevation={0} sx={{
          p: 3, borderRadius: 3,
          border: `1px solid ${displayCol.border}`,
          bgcolor: displayCol.bg, textAlign: 'center',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Chip
              label={displayPct >= 65 ? 'Low Barrier' : displayPct >= 45 ? 'Medium Barrier' : 'High Barrier'}
              size="small"
              sx={{ bgcolor: displayCol.text, color: '#fff', fontWeight: 700, fontSize: 11 }}
            />
            {isEstimate && (
              <Chip label="Live estimate" size="small"
                sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontSize: 10, height: 20 }} />
            )}
          </Box>

          <GaugeSVG pct={displayPct} color={displayCol.gauge} />

          <Typography sx={{ fontSize: 52, fontWeight: 900, color: displayCol.text, lineHeight: 1, mt: -0.5 }}>
            {displayPct}%
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#6C757D', mt: 0.5 }}>
            {isEstimate ? 'estimated SME win probability' : 'SME award probability'}
          </Typography>

          {result && (
            <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 0.5 }}>
              95% CI: {Math.round(result.ci_low * 100)}% – {Math.round(result.ci_high * 100)}%
            </Typography>
          )}

          {result && (
            <Typography sx={{ fontSize: 13, fontWeight: 600, mt: 1.5, color: '#1F3A5F' }}>
              {result.recommendation}
            </Typography>
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
            <Tooltip title={saved ? 'Saved!' : 'Save this assessment'}>
              <Button size="small" variant="outlined" onClick={handleSave}
                startIcon={<SaveOutlinedIcon sx={{ fontSize: 14 }} />}
                sx={{ fontSize: 11, textTransform: 'none', borderRadius: 2,
                  borderColor: saved ? '#16a34a' : '#cbd5e1', color: saved ? '#16a34a' : '#374151',
                  bgcolor: saved ? '#f0fdf4' : '#fff',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
                {saved ? 'Saved!' : 'Save'}
              </Button>
            </Tooltip>
            <Tooltip title="Search for similar contracts">
              <Button size="small" variant="outlined" onClick={handleViewSimilar}
                startIcon={<SearchOutlinedIcon sx={{ fontSize: 14 }} />}
                sx={{ fontSize: 11, textTransform: 'none', borderRadius: 2,
                  borderColor: '#cbd5e1', color: '#374151',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
                View Similar
              </Button>
            </Tooltip>
            <Tooltip title="Learn how this score is calculated">
              <IconButton size="small" onClick={() => window.open('https://www.gov.uk/guidance/find-a-tender-service', '_blank')}
                sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 0.75, color: '#64748b',
                  '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' } }}>
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Insight cards */}
        <AnimatePresence>
          <motion.div key="insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

              {/* Strengths */}
              <InsightCard
                icon={<CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />}
                title={`Top Strengths (${insights.strengths.length})`}
                items={insights.strengths}
                borderColor="#86efac" bgColor="#f0fdf4" iconColor="#16a34a"
              />

              {/* Gaps */}
              <InsightCard
                icon={<WarningAmberOutlinedIcon sx={{ fontSize: 16 }} />}
                title={`Key Gaps / Risks (${insights.gaps.length})`}
                items={insights.gaps}
                borderColor="#fca5a5" bgColor="#fff1f2" iconColor="#dc2626"
              />

              {/* Recommendation */}
              <InsightCard
                icon={<LightbulbOutlinedIcon sx={{ fontSize: 16 }} />}
                title="Recommendation"
                items={[insights.recommendation]}
                borderColor="#93c5fd" bgColor="#eff6ff" iconColor="#1d4ed8"
                single
              />
            </Box>
          </motion.div>
        </AnimatePresence>

        {/* Factor breakdown (only after API prediction) */}
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5, color: '#1F3A5F' }}>
                Adjustment Factors
              </Typography>
              {result.factors.map(f => {
                const pos = f.direction === 'positive'
                return (
                  <Box key={f.factor} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: '#374151' }}>{f.factor}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: pos ? '#155724' : '#721C24' }}>
                        {f.adjustment >= 0 ? '+' : ''}{(f.adjustment * 100).toFixed(0)}pp
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(Math.abs(f.adjustment) * 200, 100)}
                      sx={{ height: 4, borderRadius: 2, bgcolor: '#f0f2f5',
                        '& .MuiLinearProgress-bar': { bgcolor: pos ? '#16a34a' : '#dc2626', borderRadius: 2 } }}
                    />
                  </Box>
                )
              })}
            </Paper>
          </motion.div>
        )}
      </Box>
    </Box>
  )
}
