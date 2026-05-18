import { Box, Typography, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ─── static data ──────────────────────────────────────────────────────────────

const KPI_CHIPS = [
  { value: '514,875', label: 'total contracts analysed' },
  { value: '53%',     label: 'average SME award rate across UK' },
  { value: '£284K',   label: 'average contract value' },
  { value: '11',      label: 'sectors tracked' },
]

interface NavCard {
  path: string
  iconLabel: string
  iconBg: string
  iconColor: string
  title: string
  desc: string
  action: string
  borderColor: string
}

const NAV_CARDS: NavCard[] = [
  {
    path: '/analytics/barriers',
    iconLabel: '%',
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    title: 'Which sectors hire SMEs?',
    desc: 'See which industries award the most contracts to small businesses and where to focus your efforts.',
    action: 'Explore sectors →',
    borderColor: '#86efac',
  },
  {
    path: '/analytics/barriers/sector-profiles',
    iconLabel: '📍',
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    title: 'Which regions support SMEs?',
    desc: 'Find out which parts of the UK give small businesses the best chance of winning.',
    action: 'Explore regions →',
    borderColor: '#93c5fd',
  },
  {
    path: '/analytics/barriers/institutional',
    iconLabel: '£',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    title: 'What size contracts can I win?',
    desc: 'Understand where your company size and experience matches the available contracts.',
    action: 'Explore contract sizes →',
    borderColor: '#c4b5fd',
  },
]

const QUICK_INSIGHTS = [
  {
    borderColor: '#16a34a',
    headline: 'Local Government is your best buyer',
    detail: '67% of their contracts go to SMEs vs only 28% for Central Government.',
  },
  {
    borderColor: '#d97706',
    headline: 'Contracts under £100K have a 75% SME win rate',
    detail: 'Above £1M, it drops to below 31%.',
  },
  {
    borderColor: '#2563eb',
    headline: 'IT, R&D, and Architecture are the three most SME-friendly sectors',
    detail: 'All above 60% SME rate.',
  },
]

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Analytics() {
  const navigate = useNavigate()

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 24, fontWeight: 800, color: '#1F3A5F' }}>
            Analytics Overview
          </Typography>
          <Typography sx={{ mt: 0.5, color: '#6C757D', fontSize: 14 }}>
            Understand where UK government spending goes — and where your business fits
          </Typography>
        </Box>
      </motion.div>

      {/* KPI chips */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        {KPI_CHIPS.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Paper elevation={0} sx={{
              p: 2, borderRadius: 3, border: '1px solid #e8edf3', textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1F3A5F', lineHeight: 1.1 }}>
                {k.value}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6C757D', mt: 0.5, lineHeight: 1.4 }}>
                {k.label}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Key finding banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Box sx={{
          bgcolor: '#fffbeb', border: '1px solid #fde68a',
          px: 2.5, py: 2, borderRadius: 2, mb: 3,
        }}>
          <Typography sx={{ fontSize: 13, color: '#92400e', lineHeight: 1.65 }}>
            <strong>💡</strong>{' '}
            The single biggest factor in whether a small business wins a contract is its size — contracts over £500K go to large firms 56% of the time. Focus on the right size range first, then expand.
          </Typography>
        </Box>
      </motion.div>

      {/* Navigation cards */}
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1F3A5F', mb: 2 }}>
        Explore the data
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
        gap: 2.5,
        mb: 3,
      }}>
        {NAV_CARDS.map((card, i) => (
          <motion.div
            key={card.path}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.08 }}
          >
            <Paper
              elevation={0}
              onClick={() => navigate(card.path)}
              sx={{
                p: 3, borderRadius: 3,
                border: `1px solid #e8edf3`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  borderColor: card.borderColor,
                },
              }}
            >
              {/* Icon circle */}
              <Box sx={{
                width: 44, height: 44, borderRadius: '50%',
                bgcolor: card.iconBg, color: card.iconColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: card.iconLabel.length === 1 ? 18 : 20,
                fontWeight: 800, mb: 2,
              }}>
                {card.iconLabel}
              </Box>

              <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1F3A5F', mb: 0.75 }}>
                {card.title}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6C757D', lineHeight: 1.6, mb: 1.5 }}>
                {card.desc}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: card.iconColor }}>
                {card.action}
              </Typography>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* Quick Insights */}
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1F3A5F', mb: 2 }}>
        Quick Insights
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2,
        mb: 3,
      }}>
        {QUICK_INSIGHTS.map((ins) => (
          <Box
            key={ins.headline}
            sx={{
              borderLeft: `3px solid ${ins.borderColor}`,
              pl: 2, py: 1,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F3A5F', mb: 0.4 }}>
              {ins.headline}
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#6C757D', lineHeight: 1.55 }}>
              {ins.detail}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Data based on 514,875 UK government contracts (2016–2026). Rates are approximate.
        </Typography>
      </Box>
    </Box>
  )
}
