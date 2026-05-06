import { Box, Typography, Button, Paper, Chip } from '@mui/material'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const features = [
  { icon: '🔍', title: 'Contract Search', desc: '514k+ UK contracts from 4 data sources with powerful filters' },
  { icon: '📊', title: 'SME Analytics', desc: 'Market intelligence, sector profiles, and trend analysis' },
  { icon: '🚧', title: 'Barrier Analysis', desc: 'Identify and quantify structural barriers to SME participation' },
  { icon: '🎯', title: 'Winnability Predictor', desc: 'AI-powered probability scoring for any contract opportunity' },
  { icon: '🔬', title: 'Statistical Analysis', desc: 'Hypothesis tests, regression models, and anomaly detection' },
  { icon: '🔔', title: 'Smart Alerts', desc: 'Get notified when relevant contracts are published' },
]

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F0F2F5' }}>
      {/* Navbar */}
      <Box component="nav" sx={{ bgcolor: '#fff', borderBottom: '1px solid #e8edf3', px: 4, py: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #2E75B6, #1F3A5F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 14 }}>P</Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: '#1F3A5F' }}>ProcurementAI</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button component={Link} to="/login" variant="outlined" size="small" sx={{ fontSize: 13 }}>Sign in</Button>
          <Button component={Link} to="/signup" variant="contained" size="small" sx={{ fontSize: 13 }}>Get started</Button>
        </Box>
      </Box>

      {/* Hero */}
      <Box sx={{ textAlign: 'center', px: 4, pt: 10, pb: 8 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Chip label="UK Public Procurement Intelligence" size="small"
            sx={{ bgcolor: '#e8edf3', color: '#2E75B6', fontWeight: 700, fontSize: 12, mb: 3 }} />
          <Typography sx={{ fontSize: { xs: 36, md: 52 }, fontWeight: 900, color: '#1F3A5F', lineHeight: 1.1, maxWidth: 720, mx: 'auto' }}>
            Understand the UK procurement market like never before
          </Typography>
          <Typography sx={{ fontSize: 18, color: '#6C757D', mt: 3, maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>
            Search 514,875 contracts, analyse SME barriers, predict your winnability, and detect exclusionary language — all in one platform.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
            <Button component={Link} to="/signup" variant="contained" size="large" endIcon={<ArrowForwardIcon />}
              sx={{ px: 4, py: 1.5, fontSize: 15, fontWeight: 700, borderRadius: 3 }}>
              Start for free
            </Button>
            <Button component={Link} to="/login" variant="outlined" size="large"
              sx={{ px: 4, py: 1.5, fontSize: 15, borderRadius: 3 }}>
              Sign in
            </Button>
          </Box>
          <Typography variant="caption" sx={{ color: '#9ca3af', mt: 3, display: 'block' }}>
            No credit card required · Data from CF, FTS, Companies House & Spend Data
          </Typography>
        </motion.div>
      </Box>

      {/* Features */}
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: 4, pb: 10 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}>
                <Paper elevation={0} sx={{
                  p: 3, borderRadius: 3, border: '1px solid #e8edf3', height: '100%',
                  transition: 'all 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(31,58,95,0.12)', transform: 'translateY(-3px)' },
                }}>
                  <Typography sx={{ fontSize: 32, mb: 1.5 }}>{f.icon}</Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', mb: 0.75 }}>{f.title}</Typography>
                  <Typography sx={{ fontSize: 13, color: '#6C757D', lineHeight: 1.6 }}>{f.desc}</Typography>
                </Paper>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Box>

      {/* Stats bar */}
      <Box sx={{ bgcolor: '#1F3A5F', py: 5, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 4, md: 10 }, flexWrap: 'wrap', px: 4 }}>
          {[
            { value: '514,875', label: 'Total contracts' },
            { value: '41.5%', label: 'Average SME rate' },
            { value: '4', label: 'Data sources' },
            { value: '8', label: 'Barrier dimensions' },
          ].map(({ value, label }) => (
            <Box key={label}>
              <Typography sx={{ fontSize: 32, fontWeight: 900, color: '#93c5fd' }}>{value}</Typography>
              <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box component="footer" sx={{ textAlign: 'center', py: 4, bgcolor: '#1F3A5F' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
          © 2025 ProcurementAI · University Dissertation Project · Data: UK Contracts Finder, FTS, Companies House, Spend Data
        </Typography>
      </Box>
    </Box>
  )
}
