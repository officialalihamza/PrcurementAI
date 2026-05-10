import { useState } from 'react'
import {
  Box, Typography, Tab, Tabs, Paper, Chip, LinearProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts'
import { useBarrierCorrelations, useSectorProfiles, useAuthorityProfiles } from '../../hooks/useBarriers'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import type { BarrierCorrelation, SectorProfile, AuthorityProfile } from '../../types'

function BarrierCorrelationsTab() {
  const { data, isLoading } = useBarrierCorrelations()
  if (isLoading) return <LoadingSpinner />
  const corrs: BarrierCorrelation[] = data || []
  const chartData = [...corrs].sort((a, b) =>
    Math.abs(b.correlation ?? b.cramers_v ?? 0) - Math.abs(a.correlation ?? a.cramers_v ?? 0)
  )

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Barrier Correlation with SME Exclusion</Typography>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 48, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
            <XAxis type="number" domain={[-0.7, 0.1]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="barrier" width={110} tick={{ fontSize: 10, fill: '#6C757D' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey={(d: BarrierCorrelation) => d.correlation ?? -(d.cramers_v ?? 0)} radius={[0, 3, 3, 0]}
              name="Effect size">
              {chartData.map((d) => {
                const v = Math.abs(d.correlation ?? d.cramers_v ?? 0)
                return <Cell key={d.key} fill={v >= 0.4 ? '#721C24' : v >= 0.2 ? '#856404' : '#2E75B6'} opacity={0.85} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Barrier Details</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {corrs.map(c => {
            const val = Math.abs(c.correlation ?? c.cramers_v ?? 0)
            const color = val >= 0.4 ? '#721C24' : val >= 0.2 ? '#856404' : '#2E75B6'
            return (
              <Box key={c.key}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{c.barrier}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace' }}>
                      {(c.correlation ?? c.cramers_v ?? 0).toFixed(3)}
                    </Typography>
                    <Chip label={`p ${c.p_value}`} size="small"
                      sx={{ height: 18, fontSize: 10, bgcolor: c.significant ? '#f8d7da' : '#f0f2f5',
                        color: c.significant ? '#721C24' : '#6C757D' }} />
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={val * 100}
                  sx={{ height: 5, borderRadius: 3, bgcolor: '#f0f2f5',
                    '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                <Typography variant="caption" sx={{ color: '#6C757D', mt: 0.25, display: 'block' }}>
                  {c.interpretation}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Paper>
    </Box>
  )
}

const RADAR_DIMS = ['bundling', 'stringency', 'complexity', 'timeline', 'framework'] as const
const RADAR_LABELS = ['Bundling', 'Stringency', 'Complexity', 'Timeline', 'Framework']
const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#06b6d4']

function SectorProfilesTab() {
  const { data, isLoading } = useSectorProfiles()
  const [selected, setSelected] = useState<Set<string>>(new Set(['IT Services', 'Construction', 'R&D Services']))
  if (isLoading) return <LoadingSpinner />
  const sectors: SectorProfile[] = data || []
  const visible = sectors.filter(s => selected.has(s.sector))

  const radarData = RADAR_LABELS.map((label, i) => {
    const dim = RADAR_DIMS[i]
    const row: Record<string, unknown> = { dim: label }
    visible.forEach(s => { row[s.sector] = s[dim] })
    return row
  })

  const toggle = (s: string) => {
    const ns = new Set(selected)
    if (ns.has(s)) { if (ns.size > 1) ns.delete(s) } else ns.add(s)
    setSelected(ns)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#6C757D', fontWeight: 600, mr: 1 }}>Compare:</Typography>
        {sectors.map(s => (
          <Chip key={s.sector} label={s.sector.split(' ').slice(0, 2).join(' ')} size="small"
            onClick={() => toggle(s.sector)} clickable
            sx={{ fontSize: 10, height: 22,
              bgcolor: selected.has(s.sector) ? '#2E75B6' : '#f0f2f5',
              color: selected.has(s.sector) ? '#fff' : '#1F3A5F' }} />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Barrier Profile Radar</Typography>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e8edf3" />
              <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: '#6C757D' }} />
              {visible.map((s, i) => (
                <Radar key={s.sector} name={s.sector} dataKey={s.sector}
                  stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.12} strokeWidth={2} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', overflow: 'hidden' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Composite Score Ranking</Typography>
          <Box sx={{ maxHeight: 310, overflowY: 'auto' }}>
            {[...sectors].sort((a, b) => b.composite - a.composite).map((s, i) => (
              <Box key={s.sector} onClick={() => toggle(s.sector)}
                sx={{
                  display: 'flex', gap: 2, p: 1.5, borderRadius: 2, cursor: 'pointer', mb: 0.5,
                  bgcolor: selected.has(s.sector) ? '#e8f0fe' : 'transparent',
                  '&:hover': { bgcolor: '#f0f2f5' },
                }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, w: 20, color: i < 3 ? '#721C24' : i >= sectors.length - 3 ? '#155724' : '#6C757D' }}>
                  {i + 1}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.sector}
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, ml: 1, flexShrink: 0,
                      color: s.composite > 60 ? '#721C24' : s.composite > 35 ? '#856404' : '#155724' }}>
                      {s.composite}/100
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                    <LinearProgress variant="determinate" value={s.composite} sx={{
                      flex: 1, height: 4, borderRadius: 2, bgcolor: '#f0f2f5',
                      '& .MuiLinearProgress-bar': { bgcolor: s.composite > 60 ? '#721C24' : s.composite > 35 ? '#856404' : '#155724', borderRadius: 2 },
                    }} />
                    <Typography variant="caption" sx={{ color: '#6C757D', flexShrink: 0 }}>{s.sme_rate}% SME</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

function AuthorityTab() {
  const { data, isLoading } = useAuthorityProfiles()
  if (isLoading) return <LoadingSpinner />
  const auths: AuthorityProfile[] = (data || []).sort((a: AuthorityProfile, b: AuthorityProfile) => b.composite - a.composite)
  const dims = ['bundling', 'stringency', 'complexity', 'timeline', 'framework']
  const dimLabels = ['Bundling', 'Stringency', 'Complexity', 'Timeline', 'Framework']
  const AUTH_COLORS: Record<string, string> = {
    'Central Government': '#dc2626', 'NHS': '#d97706', 'Emergency Services': '#9333ea',
    'Education': '#2563eb', 'Local Government': '#16a34a', 'Other Public Sector': '#6b7280',
  }
  const chartData = dimLabels.map((label, i) => {
    const row: Record<string, unknown> = { dim: label }
    auths.forEach(a => { row[a.authority_type] = a[dims[i] as keyof typeof a] })
    return row
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {auths.map(a => {
          const borderColor = a.composite > 60 ? '#721C24' : a.composite > 35 ? '#856404' : '#155724'
          return (
            <Paper key={a.authority_type} elevation={0} sx={{
              p: 2.5, borderRadius: 3, border: '1px solid #e8edf3',
              borderTop: `4px solid ${borderColor}`,
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{a.authority_type}</Typography>
                <Chip size="small" label={a.composite > 60 ? 'High Barrier' : a.composite > 35 ? 'Medium' : 'Low Barrier'}
                  sx={{ fontSize: 10, height: 20, bgcolor: `${borderColor}20`, color: borderColor }} />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, fontSize: 12 }}>
                {[
                  { label: 'SME Rate', value: `${a.sme_rate}%`, color: a.sme_rate >= 55 ? '#155724' : a.sme_rate >= 35 ? '#2E75B6' : '#721C24' },
                  { label: 'Barrier Score', value: `${a.composite}/100`, color: borderColor },
                  { label: 'Avg Value', value: `£${(a.avg_value / 1000).toFixed(0)}k` },
                  { label: 'Contracts', value: a.contracts.toLocaleString() },
                ].map(({ label, value, color }) => (
                  <Box key={label}>
                    <Typography variant="caption" sx={{ color: '#6C757D', display: 'block' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: color || '#1F3A5F' }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )
        })}
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Barrier Dimensions by Authority Type</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ left: -8, right: 8, top: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
            <XAxis dataKey="dim" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} tickFormatter={v => v.toFixed(1)} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {auths.map(a => (
              <Bar key={a.authority_type} dataKey={a.authority_type}
                fill={AUTH_COLORS[a.authority_type] || '#6b7280'} opacity={0.85} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  )
}

const TABS = ['Barrier Correlations', 'Sector Profiles', 'Authority Comparison']
const TAB_PATHS = [
  '/analytics/barriers',
  '/analytics/barriers/sector-profiles',
  '/analytics/barriers/institutional',
]

export default function BarrierAnalysis() {
  const location = useLocation()
  const navigate = useNavigate()
  const tab = TAB_PATHS.indexOf(location.pathname) >= 0 ? TAB_PATHS.indexOf(location.pathname) : 0
  const setTab = (idx: number) => navigate(TAB_PATHS[idx])

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>SME Barrier Analysis</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
            Quantifying structural barriers to SME participation in UK public procurement
          </Typography>
        </Box>
      </motion.div>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: '1px solid #e8edf3', minHeight: 44,
            '& .MuiTab-root': { minHeight: 44, fontSize: 12, fontWeight: 500, textTransform: 'none' },
            '& .Mui-selected': { fontWeight: 700 } }}
        >
          {TABS.map((t) => <Tab key={t} label={t} />)}
        </Tabs>
      </Paper>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === 0 && <BarrierCorrelationsTab />}
        {tab === 1 && <SectorProfilesTab />}
        {tab === 2 && <AuthorityTab />}
      </motion.div>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Model: logistic regression trained on 514,875 UK OCDS contracts (2016–2026). Baseline probabilities by sector (AUC = 0.721).
        </Typography>
      </Box>
    </Box>
  )
}
