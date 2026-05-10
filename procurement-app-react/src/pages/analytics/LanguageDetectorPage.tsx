import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { LanguageDetector } from '../../components/analytics/LanguageDetector'

export default function LanguageDetectorPage() {
  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>
            Language Detector
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
            Paste contract specification or ITT text to detect SME-unfriendly language patterns and receive rewrite suggestions
          </Typography>
        </Box>
      </motion.div>
      <LanguageDetector />
    </Box>
  )
}
