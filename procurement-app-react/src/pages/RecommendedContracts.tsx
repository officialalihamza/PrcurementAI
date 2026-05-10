import { useState } from 'react'
import {
  Box, Typography, Button, Chip, CircularProgress,
  Alert, LinearProgress, Divider, Tooltip,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AutoAwesomeIcon      from '@mui/icons-material/AutoAwesome'
import RefreshIcon          from '@mui/icons-material/Refresh'
import OpenInNewIcon        from '@mui/icons-material/OpenInNew'
import EmojiEventsIcon      from '@mui/icons-material/EmojiEvents'
import TrendingUpIcon       from '@mui/icons-material/TrendingUp'
import LocationOnIcon       from '@mui/icons-material/LocationOn'
import AttachMoneyIcon      from '@mui/icons-material/AttachMoney'
import { matchingApi }      from '../services/api'
import type { ContractMatch } from '../types'

const REC_COLORS: Record<string, { bg: string; color: string }> = {
  'Strong Match':   { bg: '#dcfce7', color: '#15803d' },
  'Good Match':     { bg: '#dbeafe', color: '#1d4ed8' },
  'Moderate Match': { bg: '#fef9c3', color: '#a16207' },
  'Weak Match':     { bg: '#fee2e2', color: '#dc2626' },
}

const DIMENSIONS = [
  { key: 'sector_match_score',      label: 'Sector Match' },
  { key: 'financial_health_score',  label: 'Financial Fit' },
  { key: 'size_fit_score',          label: 'Size Fit' },
  { key: 'geographic_fit_score',    label: 'Geographic' },
  { key: 'capability_score',        label: 'Capability' },
  { key: 'experience_score',        label: 'Experience' },
]

function ScoreCircle({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 78 ? '#16a34a' : pct >= 62 ? '#2563eb' : pct >= 45 ? '#d97706' : '#dc2626'
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" value={pct} size={56}
        sx={{ color, '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
      <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</Typography>
      </Box>
    </Box>
  )
}

function fmtValue(lo?: number, hi?: number) {
  const v = hi || lo || 0
  if (!v) return 'N/A'
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `£${(v / 1_000).toFixed(0)}K`
  return `£${v.toLocaleString()}`
}

function MatchCard({ match }: { match: ContractMatch }) {
  const [expanded, setExpanded] = useState(false)
  const c   = match.contract || {}
  const rec = REC_COLORS[match.recommendation] || REC_COLORS['Weak Match']

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 2, mb: 1.5,
        '&:hover': { borderColor: '#94a3b8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
        transition: 'all 0.15s' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <ScoreCircle score={match.total_score} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F3A5F', flex: 1 }}>
                {(c as { title?: string }).title || 'Untitled Contract'}
              </Typography>
              <Chip label={match.recommendation} size="small"
                sx={{ fontSize: 11, fontWeight: 600, bgcolor: rec.bg, color: rec.color }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {(c as { buyer?: string }).buyer && (
                <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                  {(c as { buyer?: string }).buyer}
                </Typography>
              )}
              {(c as { region?: string }).region && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <LocationOnIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: 12, color: '#64748b' }}>{(c as { region?: string }).region}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                <AttachMoneyIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                  {fmtValue((c as { value_low?: number }).value_low, (c as { value_high?: number }).value_high)}
                </Typography>
              </Box>
              {(c as { sector?: string }).sector && (
                <Chip label={(c as { sector?: string }).sector} size="small"
                  sx={{ fontSize: 10, bgcolor: '#f1f5f9', color: '#475569', height: 18 }} />
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Button size="small" onClick={() => setExpanded(v => !v)}
              sx={{ fontSize: 11, textTransform: 'none', color: '#64748b', minWidth: 'auto', px: 1 }}>
              {expanded ? 'Less' : 'Details'}
            </Button>
            {(c as { url?: string }).url && (
              <Tooltip title="View contract">
                <Button size="small" variant="outlined" component="a"
                  href={(c as { url?: string }).url} target="_blank" rel="noopener noreferrer"
                  sx={{ minWidth: 32, p: 0.5, borderColor: '#e2e8f0' }}>
                  <OpenInNewIcon sx={{ fontSize: 14 }} />
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>

        {expanded && (
          <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 1 }}>
              Score Breakdown
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 1 }}>
              {DIMENSIONS.map(d => {
                const val = match[d.key as keyof ContractMatch] as number ?? 0
                const pct = Math.round(val * 100)
                return (
                  <Box key={d.key}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                      <Typography sx={{ fontSize: 11, color: '#64748b' }}>{d.label}</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{pct}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 5, borderRadius: 1,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: pct >= 70 ? '#16a34a' : pct >= 50 ? '#2563eb' : '#f59e0b'
                        }
                      }} />
                  </Box>
                )
              })}
            </Box>
          </Box>
        )}
      </Box>
    </motion.div>
  )
}

const REC_FILTERS = ['', 'Strong Match', 'Good Match', 'Moderate Match', 'Weak Match']

export default function RecommendedContracts() {
  const qc = useQueryClient()
  const [recFilter, setRecFilter] = useState('')
  const [minScore,  setMinScore]  = useState(0)

  const params = Object.fromEntries(
    Object.entries({ min_score: minScore || undefined, recommendation: recFilter || undefined, limit: 50 })
      .filter(([, v]) => v !== undefined && v !== '')
  )

  const { data, isLoading, error: qErr } = useQuery({
    queryKey: ['matches', params],
    queryFn: async () => {
      const { data } = await matchingApi.getMatches(params)
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  const { data: summary } = useQuery({
    queryKey: ['matches-summary'],
    queryFn: async () => {
      const { data } = await matchingApi.getSummary()
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

  const scan = useMutation({
    mutationFn: () => matchingApi.findMatches(100),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] })
      qc.invalidateQueries({ queryKey: ['matches-summary'] })
    },
  })

  const matches: ContractMatch[] = data?.matches || []
  const total                    = data?.total    || 0

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>
              Recommended Contracts
            </Typography>
            <Typography sx={{ mt: 0.5, color: '#6C757D', fontSize: 14 }}>
              {total > 0 ? `${total} contracts scored for your company` : 'Run a scan to find your best opportunities'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={scan.isPending ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <AutoAwesomeIcon />}
            onClick={() => scan.mutate()}
            disabled={scan.isPending}
            sx={{ height: 40, px: 2.5, fontSize: 13, fontWeight: 600, textTransform: 'none',
              bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' },
              boxShadow: '0 2px 8px rgba(29,78,216,0.3)', borderRadius: 2 }}>
            {scan.isPending ? 'Scanning…' : 'Scan Contracts'}
          </Button>
        </Box>
      </motion.div>

      {scan.isError && (
        <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
          {(scan.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Scan failed. Make sure your company profile is complete.'}
        </Alert>
      )}

      {/* Summary KPIs */}
      {summary && summary.total > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 1.5, mb: 2.5 }}>
          {[
            { label: 'Total Scored',  value: summary.total,                    icon: <TrendingUpIcon sx={{ fontSize: 18, color: '#2563eb' }} /> },
            { label: 'Avg Score',     value: `${Math.round(summary.avg_score * 100)}%`, icon: <EmojiEventsIcon sx={{ fontSize: 18, color: '#d97706' }} /> },
            { label: 'Strong Matches',value: summary.by_recommendation?.['Strong Match'] || 0, icon: <EmojiEventsIcon sx={{ fontSize: 18, color: '#16a34a' }} /> },
            { label: 'Good Matches',  value: summary.by_recommendation?.['Good Match'] || 0,   icon: <EmojiEventsIcon sx={{ fontSize: 18, color: '#2563eb' }} /> },
          ].map(k => (
            <Box key={k.label} sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                {k.icon}
                <Typography sx={{ fontSize: 11, color: '#64748b' }}>{k.label}</Typography>
              </Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1F3A5F' }}>{k.value}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 2, border: '1px solid #e2e8f0', p: 1.5, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Filter:</Typography>
        {REC_FILTERS.map(r => (
          <Chip key={r || 'all'} label={r || 'All'} size="small"
            onClick={() => setRecFilter(r)}
            sx={{ fontSize: 11, cursor: 'pointer',
              bgcolor: recFilter === r ? '#1d4ed8' : '#f1f5f9',
              color:   recFilter === r ? '#fff'    : '#475569' }} />
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        {[0, 0.4, 0.6, 0.75].map(s => (
          <Chip key={s} label={s === 0 ? 'Any score' : `≥ ${Math.round(s * 100)}%`} size="small"
            onClick={() => setMinScore(s)}
            sx={{ fontSize: 11, cursor: 'pointer',
              bgcolor: minScore === s ? '#475569' : '#f1f5f9',
              color:   minScore === s ? '#fff'    : '#475569' }} />
        ))}
        {total > 0 && (
          <Box sx={{ ml: 'auto' }}>
            <Button size="small" startIcon={<RefreshIcon sx={{ fontSize: 13 }} />}
              onClick={() => qc.invalidateQueries({ queryKey: ['matches'] })}
              sx={{ fontSize: 11, textTransform: 'none', color: '#64748b' }}>
              Refresh
            </Button>
          </Box>
        )}
      </Box>

      {/* Results */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && matches.length === 0 && !qErr && (
        <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <AutoAwesomeIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>
            No matches yet
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#94a3b8', mt: 0.5 }}>
            Click "Scan Contracts" to find your best opportunities
          </Typography>
        </Box>
      )}

      {matches.map(m => <MatchCard key={m.id} match={m} />)}
    </Box>
  )
}
