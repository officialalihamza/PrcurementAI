import { Box, Typography, Paper } from '@mui/material'
import { motion } from 'framer-motion'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'

// ─── Coming Soon page component ───────────────────────────────────────────────

interface ComingSoonPageProps {
  label: string
}

function ComingSoonPage({ label }: ComingSoonPageProps) {
  const features = [
    {
      title: 'Year-on-Year Trends',
      desc: 'See how SME rates are changing in your sector over time',
    },
    {
      title: 'Buyer Spending Patterns',
      desc: 'Which buyers spend most in your sector and how often they award to SMEs',
    },
    {
      title: 'Competitor Analysis',
      desc: 'How many businesses typically bid for contracts in your size range',
    },
  ]

  return (
    <Box sx={{ textAlign: 'center', py: 6 }}>
      <HourglassEmptyIcon sx={{ fontSize: 64, color: '#9ca3af', mb: 2 }} />
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1F3A5F', mb: 1 }}>
        Coming Soon
      </Typography>
      <Typography sx={{ fontSize: 14, color: '#6C757D', maxWidth: 480, mx: 'auto', mb: 4, lineHeight: 1.65 }}>
        {label}
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        gap: 2,
        maxWidth: 760,
        mx: 'auto',
      }}>
        {features.map(f => (
          <Paper
            key={f.title}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '2px dashed #d1d5db',
              bgcolor: '#f9fafb',
              textAlign: 'left',
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#374151', mb: 0.75 }}>
              {f.title}
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              {f.desc}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function StatisticalAnalysis() {
  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 24, fontWeight: 800, color: '#1F3A5F' }}>
            Deep Dive Analysis
          </Typography>
          <Typography sx={{ mt: 0.5, color: '#6C757D', fontSize: 14 }}>
            Detailed breakdowns and trend analysis for your sector
          </Typography>
        </Box>
      </motion.div>
      <ComingSoonPage label="Detailed sector breakdowns, year-on-year trends, and buyer spending patterns are being prepared." />
    </Box>
  )
}
