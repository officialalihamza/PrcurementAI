import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, Chip, CircularProgress, Alert,
  LinearProgress, Tooltip, TextField, Select, MenuItem,
  FormControl, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Paper, Divider, Collapse,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import AutoAwesomeIcon           from '@mui/icons-material/AutoAwesome'
import OpenInNewIcon             from '@mui/icons-material/OpenInNew'
import TuneIcon                  from '@mui/icons-material/Tune'
import RestartAltIcon            from '@mui/icons-material/RestartAlt'
import BusinessOutlinedIcon      from '@mui/icons-material/BusinessOutlined'
import KeyboardArrowDownIcon     from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon       from '@mui/icons-material/KeyboardArrowUp'
import ExpandMoreIcon            from '@mui/icons-material/ExpandMore'
import ExpandLessIcon            from '@mui/icons-material/ExpandLess'
import CheckCircleOutlinedIcon   from '@mui/icons-material/CheckCircleOutlined'
import WarningAmberIcon          from '@mui/icons-material/WarningAmber'
import LightbulbOutlinedIcon     from '@mui/icons-material/LightbulbOutlined'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import { matchingApi, contractsApi, companyApi } from '../services/api'
import { useCompanyStore }                        from '../store/companyStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoredMatch {
  contract: {
    id: string; ocid: string; title?: string; buyer?: string
    sector?: string; region?: string; value?: number
    deadline?: string; url?: string; source?: string; status?: string
  }
  total_score: number
  recommendation: string
  sector_match_score: number
  financial_health_score: number
  size_fit_score: number
  geographic_fit_score: number
  capability_score: number
  experience_score: number
  timeline_capacity_score: number
  compliance_score: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  risks: string[]
}

interface Filters {
  cpv: string; region: string; valueBand: string
  smeFlag: string; dateFrom: string; dateTo: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALUE_BANDS = [
  { label: 'Any value',    min: 0,         max: 0 },
  { label: 'Under £25K',   min: 0,         max: 25_000 },
  { label: '£25K–£100K',  min: 25_000,    max: 100_000 },
  { label: '£100K–£500K', min: 100_000,   max: 500_000 },
  { label: '£500K–£1M',   min: 500_000,   max: 1_000_000 },
  { label: '£1M–£5M',     min: 1_000_000, max: 5_000_000 },
  { label: 'Over £5M',    min: 5_000_000, max: 0 },
]
const REGIONS = [
  'Any', 'London', 'South East', 'South West', 'East of England',
  'East Midlands', 'West Midlands', 'Yorkshire and The Humber',
  'North West', 'North East', 'Scotland', 'Wales', 'Northern Ireland',
]
const REC_CHIP: Record<string, { bg: string; color: string; dot: string }> = {
  'Strong Match':   { bg: '#dcfce7', color: '#15803d', dot: '#16a34a' },
  'Good Match':     { bg: '#dbeafe', color: '#1d4ed8', dot: '#2563eb' },
  'Moderate Match': { bg: '#fef9c3', color: '#a16207', dot: '#d97706' },
  'Weak Match':     { bg: '#fee2e2', color: '#dc2626', dot: '#ef4444' },
}
const DIMENSIONS = [
  { key: 'sector_match_score',      label: 'Sector Match' },
  { key: 'financial_health_score',  label: 'Financial Fit' },
  { key: 'size_fit_score',          label: 'Size Fit' },
  { key: 'geographic_fit_score',    label: 'Geographic' },
  { key: 'capability_score',        label: 'Capability' },
  { key: 'experience_score',        label: 'Experience' },
  { key: 'timeline_capacity_score', label: 'Timeline' },
  { key: 'compliance_score',        label: 'Compliance' },
]
const DEFAULT_FILTERS: Filters = {
  cpv: '', region: 'Any', valueBand: '', smeFlag: 'any', dateFrom: '', dateTo: '',
}

const selectSx = {
  fontSize: 13, height: 38, bgcolor: '#f8fafc',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
}
const inputSx = {
  height: 38, bgcolor: '#f8fafc',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#94a3b8' },
  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 78) return '#16a34a'
  if (pct >= 62) return '#2563eb'
  if (pct >= 45) return '#d97706'
  return '#ef4444'
}
function fmtValue(v?: number) {
  if (!v) return '—'
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `£${(v / 1_000).toFixed(0)}K`
  return `£${v.toLocaleString()}`
}
function fmtDate(d?: string) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}
function truncate(s?: string, n = 60) {
  if (!s) return '—'
  return s.length > n ? s.slice(0, n) + '…' : s
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const pct   = Math.round(score * 100)
  const color = scoreColor(pct)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" value={pct} size={32}
          sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 8, fontWeight: 800, color }}>{pct}</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</Typography>
    </Box>
  )
}

// ─── Expanded row ─────────────────────────────────────────────────────────────

function ExpandedRow({ match, colSpan }: { match: ScoredMatch; colSpan: number }) {
  const hasInsights = !!(
    match.strengths?.length || match.weaknesses?.length ||
    match.recommendations?.length || match.risks?.length
  )
  return (
    <TableRow>
      <TableCell colSpan={colSpan} sx={{ p: 0, border: 0, bgcolor: '#fafbfc' }}>
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#374151', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Score Breakdown
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 24px', mb: hasInsights ? 2.5 : 0 }}>
            {DIMENSIONS.map(d => {
              const val = (match[d.key as keyof ScoredMatch] as number) ?? 0
              const dp  = Math.round(val * 100)
              const c   = scoreColor(dp)
              return (
                <Box key={d.key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '3px' }}>
                    <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{d.label}</Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: c }}>{dp}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={dp}
                    sx={{ height: 4, borderRadius: 2, bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': { bgcolor: c, borderRadius: 2 } }} />
                </Box>
              )
            })}
          </Box>
          {hasInsights && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }, gap: 1.5 }}>
              {match.strengths?.length ? (
                <Box sx={{ bgcolor: '#f0fdf4', borderRadius: 1.5, p: 1.5 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#15803d', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Strengths</Typography>
                  {match.strengths.map((t, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.4 }}>
                      <CheckCircleOutlinedIcon sx={{ fontSize: 12, color: '#16a34a', mt: '2px', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{t}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}
              {match.weaknesses?.length ? (
                <Box sx={{ bgcolor: '#fff7ed', borderRadius: 1.5, p: 1.5 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#c2410c', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Weaknesses</Typography>
                  {match.weaknesses.map((t, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.4 }}>
                      <WarningAmberIcon sx={{ fontSize: 12, color: '#d97706', mt: '2px', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{t}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}
              {match.recommendations?.length ? (
                <Box sx={{ bgcolor: '#eff6ff', borderRadius: 1.5, p: 1.5 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recommendations</Typography>
                  {match.recommendations.map((t, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.4 }}>
                      <LightbulbOutlinedIcon sx={{ fontSize: 12, color: '#2563eb', mt: '2px', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{t}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}
              {match.risks?.length ? (
                <Box sx={{ bgcolor: '#fff1f2', borderRadius: 1.5, p: 1.5 }}>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#be123c', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risks</Typography>
                  {match.risks.map((t, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 0.5, mb: 0.4 }}>
                      <ReportProblemOutlinedIcon sx={{ fontSize: 12, color: '#e11d48', mt: '2px', flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{t}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Box>
          )}
        </Box>
      </TableCell>
    </TableRow>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecommendedContracts() {
  const navigate   = useNavigate()
  const company    = useCompanyStore(s => s.company)
  const setCompany = useCompanyStore(s => s.setCompany)

  // ── Company profile load ─────────────────────────────────────────────────────
  const [profileLoading, setProfileLoading] = useState(!company)
  const [profileChecked, setProfileChecked] = useState(!!company)

  useEffect(() => {
    if (!company) {
      companyApi.get()
        .then(({ data }) => { if (data.company) setCompany(data.company as Record<string, unknown>) })
        .catch(() => {})
        .finally(() => { setProfileLoading(false); setProfileChecked(true) })
    } else {
      setProfileLoading(false)
      setProfileChecked(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible]   = useState(true)
  const [showAdvanced,  setShowAdvanced]    = useState(false)
  const [filters, setFilters]               = useState<Filters>(DEFAULT_FILTERS)

  // ── Results state ────────────────────────────────────────────────────────────
  const [matches,     setMatches]     = useState<ScoredMatch[]>([])
  const [status,      setStatus]      = useState<'idle' | 'fetching' | 'scoring' | 'done'>('idle')
  const [error,       setError]       = useState('')
  const [page,        setPage]        = useState(0)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const ROWS_PER_PAGE = 10

  // ── Scoring mutation ─────────────────────────────────────────────────────────
  const runScore = useMutation({
    mutationFn: async (f: Filters) => {
      setError('')
      setPage(0)
      setStatus('fetching')

      const band = VALUE_BANDS.find(b => b.label === f.valueBand)
      const searchParams: Record<string, unknown> = { page: 1, page_size: 100 }
      if (f.cpv)                          searchParams.cpv       = [f.cpv]
      if (f.region && f.region !== 'Any') searchParams.regions   = f.region
      if (f.smeFlag !== 'any')            searchParams.sme_flag  = f.smeFlag
      if (f.dateFrom)                     searchParams.date_from = f.dateFrom
      if (f.dateTo)                       searchParams.date_to   = f.dateTo
      if (band?.min)                      searchParams.value_min = band.min
      if (band?.max)                      searchParams.value_max = band.max

      const { data: cd } = await contractsApi.search(searchParams)
      const contracts = cd?.contracts || []
      if (!contracts.length) throw new Error('No contracts returned from live sources')

      setStatus('scoring')
      const latestCompany = useCompanyStore.getState().company
      const { data } = await matchingApi.score(latestCompany as Record<string, unknown>, contracts)
      return data.matches as ScoredMatch[]
    },
    onSuccess: (data) => { setMatches(data); setStatus('done') },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || (err as Error)?.message || 'Scoring failed'
      setError(msg)
      setStatus('idle')
    },
  })

  // Auto-score once company profile is available
  const autoScored = useState(false)
  useEffect(() => {
    if (profileChecked && company && !autoScored[0]) {
      autoScored[1](true)
      runScore.mutate(DEFAULT_FILTERS)
    }
  }, [profileChecked, company]) // eslint-disable-line react-hooks/exhaustive-deps

  const isRunning = status === 'fetching' || status === 'scoring'

  const filtered = useMemo(() => matches.filter(m => {
    if (filters.region && filters.region !== 'Any') {
      const cr = (m.contract.region || '').toLowerCase()
      if (!cr.includes(filters.region.toLowerCase())) return false
    }
    if (filters.valueBand) {
      const band = VALUE_BANDS.find(b => b.label === filters.valueBand)
      if (band) {
        const v = m.contract.value || 0
        if (band.min > 0 && v < band.min) return false
        if (band.max > 0 && v > band.max) return false
      }
    }
    return true
  }), [matches, filters])

  const paged = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE)

  const recCounts = useMemo(() => ({
    strong:   filtered.filter(m => m.recommendation === 'Strong Match').length,
    good:     filtered.filter(m => m.recommendation === 'Good Match').length,
    moderate: filtered.filter(m => m.recommendation === 'Moderate Match').length,
    weak:     filtered.filter(m => m.recommendation === 'Weak Match').length,
  }), [filtered])

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, m) => s + m.total_score, 0) / filtered.length * 100)
    : 0

  const handleApply = useCallback(() => runScore.mutate(filters), [filters]) // eslint-disable-line react-hooks/exhaustive-deps
  const handleReset = () => { setFilters(DEFAULT_FILTERS); runScore.mutate(DEFAULT_FILTERS) }
  const setF = (key: keyof Filters, val: string) => setFilters(f => ({ ...f, [key]: val }))

  // ── Loading profile ──────────────────────────────────────────────────────────
  if (profileLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
        <CircularProgress size={36} />
        <Typography sx={{ fontSize: 14, color: '#94a3b8' }}>Loading company profile…</Typography>
      </Box>
    )
  }

  // ── No company profile ───────────────────────────────────────────────────────
  if (!company) {
    return (
      <Box sx={{ textAlign: 'center', py: 12 }}>
        <BusinessOutlinedIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 1.5 }} />
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#475569', mb: 0.5 }}>
          Company profile required
        </Typography>
        <Typography sx={{ fontSize: 14, color: '#94a3b8', mb: 3 }}>
          Complete your company profile to score and rank contracts against your capabilities
        </Typography>
        <Button variant="contained" onClick={() => navigate('/profile-setup')}
          sx={{ fontWeight: 700, fontSize: 13, textTransform: 'none',
            bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
          Set Up Company Profile
        </Button>
      </Box>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1F3A5F', lineHeight: 1.2 }}>
              AI Matched Contracts
            </Typography>
            {Boolean(company?.name) && (
              <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.25 }}>
                Scoring for {String(company!.name)}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!filterVisible && (
              <Button size="small" variant="outlined"
                startIcon={<TuneIcon sx={{ fontSize: 15 }} />}
                onClick={() => setFilterVisible(true)}
                sx={{ fontSize: 12, fontWeight: 600, textTransform: 'none', height: 36,
                  borderColor: '#e2e8f0', color: '#374151', '&:hover': { borderColor: '#94a3b8' } }}>
                Show Filter
              </Button>
            )}
            <Button variant="contained" onClick={handleApply} disabled={isRunning}
              startIcon={isRunning
                ? <CircularProgress size={13} sx={{ color: '#fff' }} />
                : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
              sx={{ height: 36, px: 2.5, fontSize: 13, fontWeight: 700, textTransform: 'none',
                bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' },
                boxShadow: '0 2px 8px rgba(29,78,216,0.25)', borderRadius: 1.5 }}>
              {status === 'fetching' ? 'Fetching…' : status === 'scoring' ? 'Scoring…' : matches.length ? 'Rescore' : 'Score Contracts'}
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
      {filterVisible && (
        <Box sx={{ bgcolor: '#fff', borderRadius: 2.5, border: '1px solid #e2e8f0', p: 1.75, mb: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <TuneIcon sx={{ fontSize: 15, color: '#374151' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F3A5F' }}>Filters</Typography>
            </Box>
            <Button size="small" onClick={() => setFilterVisible(false)}
              sx={{ fontSize: 11, textTransform: 'none', color: '#6b7280', minWidth: 'auto', py: 0.25, px: 1,
                '&:hover': { bgcolor: '#f1f5f9' } }}>
              Hide Filter
            </Button>
          </Box>

          {/* Filter fields row */}
          <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField placeholder="CPV code…" size="small" label="CPV"
              value={filters.cpv} onChange={(e) => setF('cpv', e.target.value)}
              sx={{ width: 130, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }} />

            <FormControl size="small" sx={{ minWidth: 145 }}>
              <InputLabel sx={{ fontSize: 13 }}>Region</InputLabel>
              <Select label="Region" value={filters.region}
                onChange={(e) => setF('region', e.target.value)}
                sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
                {REGIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 145 }}>
              <InputLabel sx={{ fontSize: 13 }}>Value Band</InputLabel>
              <Select label="Value Band" value={filters.valueBand}
                onChange={(e) => setF('valueBand', e.target.value)}
                sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
                {VALUE_BANDS.map(b => <MenuItem key={b.label} value={b.label} sx={{ fontSize: 13 }}>{b.label}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: 13 }}>SME Flag</InputLabel>
              <Select label="SME Flag" value={filters.smeFlag}
                onChange={(e) => setF('smeFlag', e.target.value)}
                sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
                <MenuItem value="any" sx={{ fontSize: 13 }}>Any</MenuItem>
                <MenuItem value="sme" sx={{ fontSize: 13 }}>SME Suitable</MenuItem>
                <MenuItem value="large" sx={{ fontSize: 13 }}>Large Only</MenuItem>
              </Select>
            </FormControl>

            {/* Show Advanced */}
            <Button size="small" onClick={() => setShowAdvanced(v => !v)}
              endIcon={showAdvanced ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
              sx={{ height: 38, textTransform: 'none', fontSize: 12, color: '#1d4ed8',
                border: '1px solid #dbeafe', bgcolor: '#eff6ff', px: 1, borderRadius: 1.5,
                '&:hover': { bgcolor: '#dbeafe' } }}>
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </Button>

            {/* Apply */}
            <Button variant="contained" size="small" onClick={handleApply} disabled={isRunning}
              startIcon={isRunning ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <AutoAwesomeIcon sx={{ fontSize: 14 }} />}
              sx={{ height: 38, px: 2, fontSize: 13, fontWeight: 700, textTransform: 'none',
                bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' },
                boxShadow: '0 2px 6px rgba(29,78,216,0.25)', borderRadius: 1.5 }}>
              {isRunning ? (status === 'fetching' ? 'Fetching…' : 'Scoring…') : 'Apply & Score'}
            </Button>

            {/* Reset */}
            <Button size="small" onClick={handleReset} disabled={isRunning}
              startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
              sx={{ height: 38, px: 1.5, fontSize: 12, fontWeight: 600, textTransform: 'none',
                color: '#ea580c', border: '1px solid #fed7aa', bgcolor: '#fff7ed',
                '&:hover': { bgcolor: '#ffedd5' }, borderRadius: 1.5 }}>
              Reset Filter
            </Button>
          </Box>

          {/* Advanced row */}
          <Collapse in={showAdvanced}>
            <Box sx={{ display: 'flex', gap: 1.25, mt: 1.25, pt: 1.25, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <TextField label="Date From" type="date" size="small"
                value={filters.dateFrom} onChange={(e) => setF('dateFrom', e.target.value)}
                sx={{ width: 170, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }}
                slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Date To" type="date" size="small"
                value={filters.dateTo} onChange={(e) => setF('dateTo', e.target.value)}
                sx={{ width: 170, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
          </Collapse>
        </Box>
      )}

      {/* ── Progress bar ─────────────────────────────────────────────────────── */}
      {isRunning && (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress sx={{ height: 3, borderRadius: 1, mb: 0.5 }} />
          <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
            {status === 'fetching' ? 'Fetching live contracts from UK government sources…' : 'Scoring contracts against your company profile…'}
          </Typography>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

      {/* ── KPI strip ────────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    value: filtered.length,    bg: '#f8fafc',  color: '#1F3A5F' },
            { label: 'Avg Score', value: `${avgScore}%`,   bg: '#f8fafc',  color: '#1F3A5F' },
            { label: 'Strong',   value: recCounts.strong,   bg: '#dcfce7', color: '#15803d' },
            { label: 'Good',     value: recCounts.good,     bg: '#dbeafe', color: '#1d4ed8' },
            { label: 'Moderate', value: recCounts.moderate, bg: '#fef9c3', color: '#a16207' },
            { label: 'Weak',     value: recCounts.weak,     bg: '#fee2e2', color: '#dc2626' },
          ].map(k => (
            <Box key={k.label} sx={{
              px: 2, py: 1, borderRadius: 2, bgcolor: k.bg,
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70,
            }}>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</Typography>
              <Typography sx={{ fontSize: 10, color: k.color, opacity: 0.75, fontWeight: 600, mt: 0.25 }}>{k.label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* ── Empty / initial state ─────────────────────────────────────────────── */}
      {!isRunning && matches.length === 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, py: 10, textAlign: 'center' }}>
          <AutoAwesomeIcon sx={{ fontSize: 44, color: '#cbd5e1', mb: 1 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>
            {error ? 'No contracts found' : 'Scoring contracts…'}
          </Typography>
          {!error && (
            <Typography sx={{ fontSize: 13, color: '#94a3b8', mt: 0.5 }}>
              Fetching live UK contracts and scoring against your profile
            </Typography>
          )}
          {error && (
            <Button variant="contained" onClick={handleApply} sx={{ mt: 2, fontWeight: 700, fontSize: 13, textTransform: 'none', bgcolor: '#1d4ed8' }}>
              Try Again
            </Button>
          )}
        </Paper>
      )}

      {/* ── Results table ─────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ width: 32, p: '8px 6px', borderColor: '#f1f5f9' }} />
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '28%' }}>Contract Title</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '16%' }}>Buyer</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '10%' }}>Region</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '9%' }}>Value</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '10%' }}>Deadline</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '11%' }}>Winnability</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '11%' }}>Match</TableCell>
                  <TableCell sx={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', borderColor: '#f1f5f9', width: '7%' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((m, i) => {
                  const c       = m.contract
                  const rowKey  = c.id || c.ocid || String(i)
                  const chip    = REC_CHIP[m.recommendation] || REC_CHIP['Weak Match']
                  const isExpanded = expandedRow === rowKey
                  return (
                    <>
                      <TableRow key={rowKey}
                        sx={{ cursor: 'pointer', bgcolor: isExpanded ? '#f8fafc' : '#fff',
                          '&:hover': { bgcolor: '#f8fafc' }, '& td': { borderColor: '#f1f5f9' } }}
                        onClick={() => setExpandedRow(isExpanded ? null : rowKey)}
                      >
                        <TableCell sx={{ p: '8px 6px', textAlign: 'center' }}>
                          {isExpanded
                            ? <KeyboardArrowUpIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                            : <KeyboardArrowDownIcon sx={{ fontSize: 16, color: '#94a3b8' }} />}
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Tooltip title={c.title || ''} placement="top-start">
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1F3A5F',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {truncate(c.title, 55)}
                            </Typography>
                          </Tooltip>
                          {c.sector && <Typography sx={{ fontSize: 10, color: '#94a3b8', mt: 0.25 }}>{c.sector}</Typography>}
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Tooltip title={c.buyer || ''}>
                            <Typography sx={{ fontSize: 12, color: '#374151',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {truncate(c.buyer, 30)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontSize: 12, color: '#374151',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.region && c.region !== 'Unknown' ? c.region : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                            {fmtValue(c.value)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Typography sx={{ fontSize: 12, color: '#374151' }}>{fmtDate(c.deadline)}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <ScoreBadge score={m.total_score} />
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.375, borderRadius: 20, bgcolor: chip.bg }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: chip.dot, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 600, color: chip.color, whiteSpace: 'nowrap' }}>
                              {m.recommendation}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 1.25 }} onClick={e => e.stopPropagation()}>
                          {c.url ? (
                            <Tooltip title="View contract">
                              <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                <IconButton size="small"
                                  sx={{ color: '#1d4ed8', '&:hover': { bgcolor: '#eff6ff' }, borderRadius: 1 }}>
                                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </a>
                            </Tooltip>
                          ) : (
                            <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>—</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && <ExpandedRow key={`${rowKey}-exp`} match={m} colSpan={9} />}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ borderTop: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
            <TablePagination
              component="div" count={filtered.length} page={page} rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
              onPageChange={(_, p) => { setPage(p); setExpandedRow(null) }}
              sx={{
                '.MuiTablePagination-toolbar': { minHeight: 44 },
                '.MuiTablePagination-displayedRows': { fontSize: 12, color: '#6b7280' },
                '.MuiTablePagination-actions button': { color: '#374151' },
              }}
            />
          </Box>
        </Paper>
      )}
    </Box>
  )
}
