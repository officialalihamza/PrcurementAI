import { Box, Typography, Paper, Chip, LinearProgress } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBarrierSummary } from '../../hooks/useBarriers'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts'

const navCards = [
  {
    path: '/analytics/barriers',
    icon: '🚧',
    title: 'Barrier Analysis',
    desc: 'Correlations, sector profiles, authority comparison — quantify what excludes SMEs',
    color: '#721C24', bg: '#fff5f5',
  },
  {
    path: '/analytics/barriers/sector-profiles',
    icon: '📊',
    title: 'Sector Profiles',
    desc: 'Radar charts comparing barrier dimensions across 15 CPV sectors',
    color: '#2E75B6', bg: '#f0f6ff',
  },
  {
    path: '/analytics/barriers/institutional',
    icon: '🏛️',
    title: 'Institutional Comparison',
    desc: 'Central Government vs Local Government vs NHS — who creates the most barriers?',
    color: '#856404', bg: '#fffbf0',
  },
  {
    path: '/analytics/barriers/winnability',
    icon: '🎯',
    title: 'Winnability Predictor',
    desc: 'Enter contract parameters → get SME award probability with 95% confidence interval',
    color: '#155724', bg: '#f0fff4',
  },
  {
    path: '/analytics/barriers/language-detector',
    icon: '🔍',
    title: 'Language Detector',
    desc: 'Paste any contract specification — AI detects SME-unfriendly patterns + rewrites',
    color: '#1F3A5F', bg: '#f0f2f5',
  },
  {
    path: '/analytics/stats',
    icon: '🔬',
    title: 'Statistical Analysis',
    desc: 'Hypothesis tests, sector logistic regression, regional competitiveness scoring',
    color: '#9333ea', bg: '#faf0ff',
  },
]

const BARRIER_DIMS = [
  { dim: 'Bundling',    score: 0.49, color: '#721C24' },
  { dim: 'Stringency', score: 0.41, color: '#721C24' },
  { dim: 'Framework',  score: 0.34, color: '#856404' },
  { dim: 'Complexity', score: 0.30, color: '#856404' },
  { dim: 'Timeline',   score: 0.24, color: '#856404' },
  { dim: 'Incumbent',  score: 0.22, color: '#2E75B6' },
]

const RADAR_DATA = [
  { axis: 'Bundling', Central: 0.78, Local: 0.42, NHS: 0.61 },
  { axis: 'Stringency', Central: 0.71, Local: 0.38, NHS: 0.58 },
  { axis: 'Complexity', Central: 0.65, Local: 0.44, NHS: 0.52 },
  { axis: 'Timeline', Central: 0.60, Local: 0.35, NHS: 0.48 },
  { axis: 'Framework', Central: 0.55, Local: 0.28, NHS: 0.42 },
]

const KEY_FINDINGS = [
  'Contract bundling (value vs sector median) is the single strongest barrier to SME participation (r = −0.49)',
  'Requirement stringency (ISO, turnover thresholds, years experience) reduces SME wins by 41%',
  'Framework agreements create structural lock-in — Cramér\'s V = 0.34',
  'Local Government is 2.4× more SME-accessible than Central Government',
  'R&D and Architecture sectors have near-zero structural barriers; Financial Services has the highest',
]

export default function Analytics() {
  const navigate = useNavigate()
  const { data: summary } = useBarrierSummary()

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>Analytics</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
            SME barrier analysis, statistical tests, and predictive models — based on 514,875 UK contracts
          </Typography>
        </Box>
      </motion.div>

      {/* KPI strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {[
          { label: 'Strongest Barrier',     value: summary?.strongest_barrier      || 'Contract Bundling',   sub: 'r = −0.49', color: '#721C24' },
          { label: 'Highest-Barrier Sector', value: summary?.highest_barrier_sector || 'Financial Services',  sub: 'Score 73/100', color: '#856404' },
          { label: 'Most SME-Friendly',      value: summary?.most_sme_friendly_authority || 'Local Gov',      sub: '67% SME rate', color: '#155724' },
          { label: 'Least SME-Friendly',     value: summary?.least_sme_friendly_authority || 'Central Gov',   sub: '28% SME rate', color: '#721C24' },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
              <Typography variant="caption" sx={{ color: '#6C757D', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
                {k.label}
              </Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: k.color, mt: 0.5, lineHeight: 1.2 }}>{k.value}</Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>{k.sub}</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Key findings */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #fde68a', bgcolor: '#fffbf0', mb: 3 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#856404', mb: 1.5 }}>⚠️ Key Research Findings</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {KEY_FINDINGS.map(f => (
              <Box key={f} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Typography sx={{ color: '#d97706', flexShrink: 0, mt: 0.1 }}>→</Typography>
                <Typography sx={{ fontSize: 13, color: '#1F3A5F', lineHeight: 1.5 }}>{f}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </motion.div>

      {/* Charts row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>Barrier Effect Sizes (|r|)</Typography>
            <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
              Correlation with SME exclusion — higher = stronger barrier
            </Typography>
            {BARRIER_DIMS.map(d => (
              <Box key={d.dim} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13 }}>{d.dim}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: d.color, fontFamily: 'monospace' }}>
                    {d.score.toFixed(3)}
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={d.score * 100}
                  sx={{ height: 6, borderRadius: 3, bgcolor: '#f0f2f5',
                    '& .MuiLinearProgress-bar': { bgcolor: d.color, borderRadius: 3 } }} />
              </Box>
            ))}
          </Paper>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>Barrier Profile by Authority Type</Typography>
            <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
              Central Gov consistently scores highest across all dimensions
            </Typography>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke="#e8edf3" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#6C757D' }} />
                <Radar name="Central Gov" dataKey="Central" stroke="#721C24" fill="#721C24" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="NHS" dataKey="NHS" stroke="#d97706" fill="#d97706" fillOpacity={0.1} strokeWidth={2} />
                <Radar name="Local Gov" dataKey="Local" stroke="#155724" fill="#155724" fillOpacity={0.1} strokeWidth={2} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 1 }}>
              {[['#721C24','Central Gov'], ['#d97706','NHS'], ['#155724','Local Gov']].map(([c, l]) => (
                <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
                  <Typography variant="caption" sx={{ color: '#6C757D', fontSize: 10 }}>{l}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </motion.div>
      </Box>

      {/* Navigation cards */}
      <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2, color: '#1F3A5F' }}>Explore Analytics Modules</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
        {navCards.map((card, i) => (
          <motion.div key={card.path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.06 }}>
            <Paper
              elevation={0} onClick={() => navigate(card.path)}
              sx={{
                p: 2.5, borderRadius: 3, border: `1px solid ${card.color}20`,
                bgcolor: card.bg, cursor: 'pointer', transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${card.color}18`, borderColor: `${card.color}50` },
              }}
            >
              <Typography sx={{ fontSize: 28, mb: 1 }}>{card.icon}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F3A5F', mb: 0.75 }}>{card.title}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6C757D', lineHeight: 1.5 }}>{card.desc}</Typography>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: card.color, mt: 1.5 }}>Explore →</Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Analysis based on 514,875 UK OCDS contracts (2016–2026) · Logistic regression AUC = 0.721 · All p-values &lt;0.001
        </Typography>
      </Box>
    </Box>
  )
}
