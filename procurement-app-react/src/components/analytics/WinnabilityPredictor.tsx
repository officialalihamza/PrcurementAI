import { useState } from 'react'
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Paper, Chip, LinearProgress, Slider, FormControlLabel, Switch,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { barriersApi } from '../../services/api'
import type { WinnabilityResult } from '../../types'

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

const AUTH_TYPES = ['Local Government', 'Education', 'Other Public Sector', 'NHS', 'Emergency Services', 'Central Government']

function GaugeSVG({ pct, risk }: { pct: number; risk: string }) {
  const color = risk === 'Low' ? '#155724' : risk === 'Medium' ? '#856404' : '#721C24'
  const arc = pct * 2.827
  const angle = Math.PI - (pct / 100) * Math.PI
  const x2 = 100 + 75 * Math.cos(angle)
  const y2 = 100 - 75 * Math.sin(angle)
  return (
    <svg viewBox="0 0 200 110" style={{ width: 200, height: 110 }}>
      <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#e8edf3" strokeWidth="14" strokeLinecap="round" />
      <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none"
        stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${arc} 282.7`} />
      <line x1="100" y1="100" x2={x2} y2={y2} stroke="#374151" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="100" r="5" fill="#374151" />
    </svg>
  )
}

export function WinnabilityPredictor() {
  const [form, setForm] = useState({
    sector: '', region: '', authority_type: 'Local Government',
    value: 250000, timeline_days: 60,
    framework: false, certification: false, incumbent_language: false,
  })
  const [result, setResult] = useState<WinnabilityResult | null>(null)
  const [loading, setLoading] = useState(false)

  const setF = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const predict = async () => {
    if (!form.sector) return
    setLoading(true)
    try {
      const { data } = await barriersApi.predictWinnability(form as unknown as Record<string, unknown>)
      setResult(data)
    } catch {}
    setLoading(false)
  }

  const riskColor = result?.risk_level === 'Low' ? '#155724' : result?.risk_level === 'Medium' ? '#856404' : '#721C24'
  const riskBg   = result?.risk_level === 'Low' ? '#d4edda' : result?.risk_level === 'Medium' ? '#fff3cd' : '#f8d7da'

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
      {/* Form */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e8edf3' }}>
        <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Contract Parameters</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl size="small" fullWidth required>
            <InputLabel>CPV Sector *</InputLabel>
            <Select label="CPV Sector *" value={form.sector} onChange={e => setF('sector', e.target.value)} sx={{ fontSize: 13 }}>
              {SECTORS.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>)}
            </Select>
          </FormControl>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Region</InputLabel>
              <Select label="Region" value={form.region} onChange={e => setF('region', e.target.value)} sx={{ fontSize: 13 }}>
                <MenuItem value="" sx={{ fontSize: 13 }}>Any region</MenuItem>
                {REGIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Authority Type</InputLabel>
              <Select label="Authority Type" value={form.authority_type} onChange={e => setF('authority_type', e.target.value)} sx={{ fontSize: 13 }}>
                {AUTH_TYPES.map(a => <MenuItem key={a} value={a} sx={{ fontSize: 13 }}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label="Contract Value (£)" type="number" size="small" fullWidth
            value={form.value} onChange={e => setF('value', Number(e.target.value))}
            sx={{ '& input': { fontSize: 13 } }}
          />

          <Box>
            <Typography variant="caption" sx={{ color: '#6C757D', fontWeight: 600, fontSize: 11 }}>
              Timeline: {form.timeline_days} days from publication
            </Typography>
            <Slider
              value={form.timeline_days} min={7} max={180} step={7}
              onChange={(_, v) => setF('timeline_days', v)}
              sx={{ color: '#2E75B6', mt: 0.5 }}
              marks={[{ value: 30, label: '30d' }, { value: 90, label: '90d' }]}
            />
          </Box>

          {[
            { key: 'framework', label: 'Framework agreement route' },
            { key: 'certification', label: 'Requires ISO/CHAS certification' },
            { key: 'incumbent_language', label: 'Incumbent language in spec' },
          ].map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={<Switch size="small" checked={form[key as keyof typeof form] as boolean} onChange={e => setF(key, e.target.checked)} sx={{ '& .MuiSwitch-thumb': { width: 14, height: 14 } }} />}
              label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
            />
          ))}

          <Button
            variant="contained" fullWidth size="large"
            onClick={predict} disabled={loading || !form.sector}
            sx={{ mt: 1, py: 1.5, fontWeight: 700, fontSize: 14 }}
          >
            {loading ? 'Predicting…' : '▶  Predict SME Probability'}
          </Button>
        </Box>
      </Paper>

      {/* Result */}
      <Box>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: `1px solid ${riskColor}30`, bgcolor: riskBg, textAlign: 'center' }}>
                  <Chip label={`${result.risk_level} Barrier`} size="small"
                    sx={{ bgcolor: riskColor, color: '#fff', fontWeight: 700, mb: 1.5, fontSize: 11 }} />
                  <GaugeSVG pct={result.probability_pct} risk={result.risk_level} />
                  <Typography sx={{ fontSize: 44, fontWeight: 900, color: riskColor, lineHeight: 1 }}>
                    {result.probability_pct}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6C757D', mt: 0.5 }}>SME award probability</Typography>
                  <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                    95% CI: {Math.round(result.ci_low * 100)}% – {Math.round(result.ci_high * 100)}%
                  </Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 500, mt: 2, color: '#1F3A5F' }}>
                    {result.recommendation}
                  </Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 2 }}>Adjustment Factors</Typography>
                  {result.factors.map(f => (
                    <Box key={f.factor} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: 12, color: '#374151' }}>{f.factor}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700,
                          color: f.direction === 'positive' ? '#155724' : '#721C24' }}>
                          {f.adjustment >= 0 ? '+' : ''}{(f.adjustment * 100).toFixed(0)}pp
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(Math.abs(f.adjustment) * 200, 100)}
                        sx={{
                          height: 4, borderRadius: 2, bgcolor: '#f0f2f5',
                          '& .MuiLinearProgress-bar': { bgcolor: f.direction === 'positive' ? '#155724' : '#721C24', borderRadius: 2 },
                        }}
                      />
                    </Box>
                  ))}
                </Paper>
              </Box>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Paper elevation={0} sx={{
                p: 6, borderRadius: 3, border: '2px dashed #e8edf3',
                textAlign: 'center', bgcolor: '#fafbfc',
              }}>
                <Typography sx={{ fontSize: 48, mb: 2 }}>🎯</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#6C757D' }}>
                  Fill in the form and click Predict
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: '#9ca3af' }}>
                  Estimates SME award probability based on 514k UK OCDS contracts
                </Typography>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  )
}
