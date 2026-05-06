import { useState } from 'react'
import { Box, Typography, Paper, Tab, Tabs, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { motion } from 'framer-motion'
import {
  ComposedChart, BarChart, Line, Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine,
} from 'recharts'

// ── Data ──────────────────────────────────────────────────────────────────────

const HISTORICAL = [
  { year: '2016', sme: 38.2 }, { year: '2017', sme: 40.1 },
  { year: '2018', sme: 42.8 }, { year: '2019', sme: 44.5 },
  { year: '2020', sme: 46.2 }, { year: '2021', sme: 49.1 },
  { year: '2022', sme: 51.8 }, { year: '2023', sme: 53.4 },
  { year: '2024', sme: 55.7 }, { year: '2025', sme: 57.3 },
  { year: '2026', sme: 58.9 },
]
const FORECAST_ROWS = [
  { year: '2027', base: 61.2, optimistic: 63.8, pessimistic: 58.6, ci_lo: 54.0, ci_hi: 68.4 },
  { year: '2028', base: 62.8, optimistic: 66.2, pessimistic: 59.4, ci_lo: 51.5, ci_hi: 74.1 },
  { year: '2029', base: 63.7, optimistic: 68.1, pessimistic: 59.3, ci_lo: 48.8, ci_hi: 78.6 },
  { year: '2030', base: 64.3, optimistic: 69.5, pessimistic: 59.1, ci_lo: 46.5, ci_hi: 82.1 },
]
// merge historical + forecast into one series for the chart
const FORECAST_CHART = [
  ...HISTORICAL.map(d => ({ year: d.year, sme: d.sme, base: undefined as number | undefined, optimistic: undefined as number | undefined, pessimistic: undefined as number | undefined, ci_lo: undefined as number | undefined, ci_hi: undefined as number | undefined })),
  { year: '2026', sme: undefined, base: 58.9, optimistic: 58.9, pessimistic: 58.9, ci_lo: 58.9, ci_hi: 58.9 },
  ...FORECAST_ROWS.map(d => ({ year: d.year, sme: undefined, base: d.base, optimistic: d.optimistic, pessimistic: d.pessimistic, ci_lo: d.ci_lo, ci_hi: d.ci_hi })),
]

const COEFF_DATA = [
  { feature: 'Financial Services', coeff: -0.312, fill: '#721C24' },
  { feature: 'Central Gov',        coeff: -0.234, fill: '#721C24' },
  { feature: 'Framework Agree.',   coeff: -0.198, fill: '#721C24' },
  { feature: 'Contract Value(log)',coeff: -0.142, fill: '#721C24' },
  { feature: 'NHS',                coeff: -0.089, fill: '#856404' },
  { feature: 'Year Trend',         coeff:  0.035, fill: '#2E75B6' },
  { feature: 'IT Services',        coeff:  0.089, fill: '#155724' },
  { feature: 'Education',          coeff:  0.156, fill: '#155724' },
  { feature: 'Local Gov',          coeff:  0.187, fill: '#155724' },
  { feature: 'R&D Sector',         coeff:  0.245, fill: '#155724' },
]

const FEATURE_IMPORTANCE = [
  { feature: 'Doc Count',         gain: 0.018 },
  { feature: 'Timeline Days',     gain: 0.024 },
  { feature: 'Framework Flag',    gain: 0.041 },
  { feature: 'Year Published',    gain: 0.072 },
  { feature: 'Region',            gain: 0.098 },
  { feature: 'CPV Sector',        gain: 0.187 },
  { feature: 'Authority Type',    gain: 0.248 },
  { feature: 'Contract Value',    gain: 0.312 },
]

const MODELS = [
  { model: 'Logistic Regression', auc: 0.633, f1: 0.521, accuracy: 61.2, color: '#6C757D' },
  { model: 'Random Forest',       auc: 0.698, f1: 0.581, accuracy: 63.1, color: '#2E75B6' },
  { model: 'XGBoost',             auc: 0.721, f1: 0.608, accuracy: 64.6, color: '#155724' },
]

const CLUSTERS = [
  { name: 'SME Champions',  count: 142, sme_rate: 72, avg_value: 45,  color: '#155724', desc: 'Small councils, research bodies — consistently award to SMEs' },
  { name: 'SME-Friendly',   count: 289, sme_rate: 58, avg_value: 98,  color: '#2E75B6', desc: 'Local authorities and education — above-average SME engagement' },
  { name: 'Neutral',        count: 341, sme_rate: 42, avg_value: 187, color: '#856404', desc: 'Mixed NHS and regional bodies — near-average participation' },
  { name: 'Large-Focused',  count: 178, sme_rate: 24, avg_value: 892, color: '#721C24', desc: 'Central government — high-value bundled contracts dominate' },
]

const TOP_AUTHORITIES = [
  { authority: 'Innovate UK',                  cluster: 'SME Champions', sme_rate: 84 },
  { authority: 'Cornwall Council',             cluster: 'SME Champions', sme_rate: 81 },
  { authority: 'Welsh Government R&D',         cluster: 'SME Champions', sme_rate: 79 },
  { authority: 'Leeds City Council',           cluster: 'SME-Friendly',  sme_rate: 74 },
  { authority: 'North Yorkshire CC',           cluster: 'SME Champions', sme_rate: 73 },
  { authority: 'Sheffield City Council',       cluster: 'SME-Friendly',  sme_rate: 71 },
  { authority: 'University of Edinburgh',      cluster: 'SME-Friendly',  sme_rate: 69 },
  { authority: 'Greater Manchester CA',        cluster: 'SME-Friendly',  sme_rate: 67 },
  { authority: 'East Riding of Yorkshire',     cluster: 'SME-Friendly',  sme_rate: 66 },
  { authority: 'Lincolnshire CC',              cluster: 'SME-Friendly',  sme_rate: 65 },
]

const TABS = ['Forecasting', 'Predictive Models', 'Regression Analysis', 'Authority Clustering']

// ── Tab: Forecasting ──────────────────────────────────────────────────────────
function ForecastingTab() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {[
          { label: 'Model',        value: 'ARIMA(0,1,1)', color: '#2E75B6' },
          { label: 'R²',           value: '0.852',        color: '#155724' },
          { label: '2030 Base',    value: '64.3%',        color: '#1F3A5F' },
          { label: 'Annual Growth',value: '+3.57%/yr',    color: '#856404' },
          { label: '95% CI 2030',  value: '47% – 81%',   color: '#721C24' },
        ].map(k => (
          <Paper key={k.label} elevation={0} sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e8edf3', minWidth: 110 }}>
            <Typography variant="caption" sx={{ color: '#6C757D', fontSize: 10, display: 'block' }}>{k.label}</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: k.color }}>{k.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>SME Award Rate — Historical & Forecast 2016–2030</Typography>
        <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
          ARIMA(0,1,1) with 95% confidence band · shaded = uncertainty range
        </Typography>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={FORECAST_CHART} margin={{ left: -8, right: 8, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} />
            <YAxis domain={[30, 90]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine x="2026" stroke="#9ca3af" strokeDasharray="4 4" />
            <Area dataKey="ci_hi" fill="#dbeafe" stroke="none" name="95% CI Upper" legendType="none" connectNulls />
            <Area dataKey="ci_lo" fill="#ffffff" stroke="none" name="95% CI Lower" legendType="none" connectNulls />
            <Line dataKey="sme"         stroke="#2E75B6" strokeWidth={2.5} dot={{ r: 3 }}  name="Historical SME %" connectNulls />
            <Line dataKey="base"        stroke="#2E75B6" strokeWidth={2}   strokeDasharray="6 3" dot={false} name="Base Forecast"          connectNulls />
            <Line dataKey="optimistic"  stroke="#155724" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Optimistic (+5%/yr)"    connectNulls />
            <Line dataKey="pessimistic" stroke="#721C24" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Pessimistic (−5%/yr)"   connectNulls />
          </ComposedChart>
        </ResponsiveContainer>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Scenario Table 2027–2030</Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <TableCell>Year</TableCell>
              <TableCell align="center">Base</TableCell>
              <TableCell align="center" sx={{ color: '#155724' }}>Optimistic</TableCell>
              <TableCell align="center" sx={{ color: '#721C24' }}>Pessimistic</TableCell>
              <TableCell align="center">95% CI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {FORECAST_ROWS.map(row => (
              <TableRow key={row.year} hover>
                <TableCell sx={{ fontWeight: 700 }}>{row.year}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#2E75B6', fontFamily: 'monospace' }}>{row.base.toFixed(1)}%</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#155724', fontFamily: 'monospace' }}>{row.optimistic.toFixed(1)}%</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#721C24', fontFamily: 'monospace' }}>{row.pessimistic.toFixed(1)}%</TableCell>
                <TableCell align="center" sx={{ color: '#6C757D', fontFamily: 'monospace', fontSize: 12 }}>
                  {row.ci_lo.toFixed(0)}% – {row.ci_hi.toFixed(0)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}

// ── Tab: Predictive Models ────────────────────────────────────────────────────
function PredictiveModelsTab() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 2 }}>
        {MODELS.map(m => {
          const best = m.model === 'XGBoost'
          return (
            <Paper key={m.model} elevation={0} sx={{
              p: 2.5, borderRadius: 3,
              border: `2px solid ${best ? m.color : '#e8edf3'}`,
              bgcolor: best ? '#f0fff4' : '#fff', position: 'relative',
            }}>
              {best && <Chip label="Best Model" size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#d4edda', color: '#155724', fontSize: 10 }} />}
              <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1.5 }}>{m.model}</Typography>
              {[{ l: 'AUC-ROC', v: m.auc.toFixed(3) }, { l: 'F1 Score', v: m.f1.toFixed(3) }, { l: 'Accuracy', v: `${m.accuracy}%` }].map(s => (
                <Box key={s.l} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography sx={{ fontSize: 12, color: '#6C757D' }}>{s.l}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: m.color, fontFamily: 'monospace' }}>{s.v}</Typography>
                </Box>
              ))}
            </Paper>
          )
        })}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>AUC-ROC Comparison</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MODELS} layout="vertical" margin={{ left: 20, right: 32, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
              <XAxis type="number" domain={[0.55, 0.8]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="model" width={120} tick={{ fontSize: 10, fill: '#6C757D' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="auc" radius={[0, 3, 3, 0]} name="AUC">
                {MODELS.map(m => <Cell key={m.model} fill={m.color} opacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>XGBoost Feature Importance (Gain)</Typography>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: 20, right: 32, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
              <XAxis type="number" tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="feature" width={110} tick={{ fontSize: 10, fill: '#6C757D' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="gain" fill="#2E75B6" opacity={0.85} radius={[0, 3, 3, 0]} name="Gain" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  )
}

// ── Tab: Regression Analysis ──────────────────────────────────────────────────
function RegressionTab() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>OLS Regression Coefficients</Typography>
        <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
          Effect on SME award probability · positive (green) = increases SME likelihood · negative (red) = reduces it
        </Typography>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={COEFF_DATA} layout="vertical" margin={{ left: 16, right: 48, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
            <XAxis type="number" domain={[-0.4, 0.32]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="feature" width={130} tick={{ fontSize: 10, fill: '#6C757D' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <ReferenceLine x={0} stroke="#9ca3af" strokeWidth={1.5} />
            <Bar dataKey="coeff" radius={[0, 3, 3, 0]} name="Coefficient">
              {COEFF_DATA.map((d, i) => <Cell key={i} fill={d.fill} opacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #fde68a', bgcolor: '#fffbf0' }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#856404', mb: 1.5 }}>⚠️ Key Regression Findings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[
            'Financial Services sector reduces SME probability by −31.2pp — the strongest single negative predictor',
            'Central Government authority type reduces SME probability by −23.4pp vs baseline',
            'Framework agreements independently suppress SME awards by −19.8pp (structural lock-in)',
            'R&D Services sector is the most SME-accessible: +24.5pp vs sector baseline',
            'Each doubling of contract value reduces SME probability by −14.2pp (log scale coefficient)',
            'National year trend shows +3.5pp improvement per year — slow but statistically significant',
          ].map(f => (
            <Box key={f} sx={{ display: 'flex', gap: 1 }}>
              <Typography sx={{ color: '#d97706', flexShrink: 0 }}>→</Typography>
              <Typography sx={{ fontSize: 13, color: '#1F3A5F', lineHeight: 1.5 }}>{f}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  )
}

// ── Tab: Authority Clustering ─────────────────────────────────────────────────
function ClusteringTab() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4,1fr)' }, gap: 2 }}>
        {CLUSTERS.map(c => (
          <Paper key={c.name} elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e8edf3', borderTop: `4px solid ${c.color}` }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 0.5 }}>{c.name}</Typography>
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.sme_rate}%</Typography>
            <Typography variant="caption" sx={{ color: '#6C757D' }}>avg SME rate</Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mt: 0.5 }}>
              {c.count} authorities · £{c.avg_value}k avg value
            </Typography>
            <Typography sx={{ fontSize: 11, color: '#6C757D', lineHeight: 1.4, mt: 1 }}>{c.desc}</Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Average SME Rate by Cluster</Typography>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={CLUSTERS} margin={{ left: -8, right: 8, top: 4, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="sme_rate" radius={[4, 4, 0, 0]} name="SME Rate">
                {CLUSTERS.map(c => <Cell key={c.name} fill={c.color} opacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Top 10 Most SME-Friendly Authorities</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {TOP_AUTHORITIES.map((a, i) => {
              const c = CLUSTERS.find(cl => cl.name === a.cluster)!
              return (
                <Box key={a.authority} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, '&:hover': { bgcolor: '#f8f9fa' } }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', minWidth: 20, fontFamily: 'monospace' }}>
                    {String(i + 1).padStart(2, '0')}
                  </Typography>
                  <Typography sx={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.authority}
                  </Typography>
                  <Chip label={`${a.sme_rate}%`} size="small"
                    sx={{ fontSize: 10, height: 20, bgcolor: `${c.color}15`, color: c.color, fontWeight: 700 }} />
                </Box>
              )
            })}
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PredictiveModels() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>
            Predictive Models & Forecasting
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
            ARIMA 2027–2030 SME forecast · XGBoost vs Logistic vs Random Forest · OLS regression · K-Means clustering
          </Typography>
        </Box>
      </motion.div>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', mb: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: '1px solid #e8edf3', minHeight: 44,
            '& .MuiTab-root':  { minHeight: 44, fontSize: 12, fontWeight: 500, textTransform: 'none' },
            '& .Mui-selected': { fontWeight: 700 } }}>
          {TABS.map(t => <Tab key={t} label={t} />)}
        </Tabs>
      </Paper>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === 0 && <ForecastingTab />}
        {tab === 1 && <PredictiveModelsTab />}
        {tab === 2 && <RegressionTab />}
        {tab === 3 && <ClusteringTab />}
      </motion.div>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Models trained on 514,875 UK OCDS contracts (2016–2026) · XGBoost AUC = 0.721 · ARIMA(0,1,1) R² = 0.852
        </Typography>
      </Box>
    </Box>
  )
}
