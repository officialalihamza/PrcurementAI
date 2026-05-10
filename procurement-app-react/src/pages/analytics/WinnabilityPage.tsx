import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { WinnabilityPredictor } from '../../components/analytics/WinnabilityPredictor'

export default function WinnabilityPage() {
  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>
            Winnability Predictor
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
            Estimate your probability of winning a public sector contract based on sector, value, and company characteristics
          </Typography>
        </Box>
      </motion.div>
      <WinnabilityPredictor />
    </Box>
  )
}
