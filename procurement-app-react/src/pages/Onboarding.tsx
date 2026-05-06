import { useState } from 'react'
import { Box, Paper, Typography, TextField, Button, Stepper, Step, StepLabel, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { companyApi } from '../services/api'

const steps = ['Company Details', 'Preferences', 'Ready']

export default function Onboarding() {
  const [activeStep, setActiveStep] = useState(0)
  const [company, setCompany] = useState({ name: '', sector: '', region: '', turnover: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleNext = async () => {
    if (activeStep === 1) {
      setLoading(true)
      try {
        await companyApi.upsert(company as unknown as Record<string, unknown>)
        setActiveStep(2)
      } catch {
        setError('Failed to save company details')
      }
      setLoading(false)
    } else {
      setActiveStep(s => s + 1)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5', p: 2 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 520 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e8edf3' }}>
          <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 800, mb: 0.5 }}>Set up your account</Typography>
          <Typography variant="body2" sx={{ mb: 3, color: '#6C757D' }}>This helps us personalise your contract recommendations</Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(s => <Step key={s}><StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 12 } }}>{s}</StepLabel></Step>)}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Company name" size="small" fullWidth value={company.name}
                onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} sx={{ '& input': { fontSize: 13 } }} />
              <TextField label="Primary sector" size="small" fullWidth value={company.sector}
                onChange={e => setCompany(c => ({ ...c, sector: e.target.value }))} sx={{ '& input': { fontSize: 13 } }} />
              <Button variant="contained" onClick={handleNext} sx={{ mt: 1, py: 1.5, fontWeight: 700 }}>Continue</Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Primary region" size="small" fullWidth value={company.region}
                onChange={e => setCompany(c => ({ ...c, region: e.target.value }))} sx={{ '& input': { fontSize: 13 } }} />
              <TextField label="Annual turnover (£)" type="number" size="small" fullWidth value={company.turnover}
                onChange={e => setCompany(c => ({ ...c, turnover: e.target.value }))} sx={{ '& input': { fontSize: 13 } }} />
              <Button variant="contained" onClick={handleNext} disabled={loading} sx={{ mt: 1, py: 1.5, fontWeight: 700 }}>
                {loading ? 'Saving…' : 'Save & continue'}
              </Button>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 48, mb: 2 }}>🎉</Typography>
              <Typography variant="h3" sx={{ fontSize: 20, fontWeight: 700, mb: 1 }}>You're all set!</Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>Your account is ready. Let's explore UK procurement opportunities.</Typography>
              <Button variant="contained" size="large" onClick={() => navigate('/dashboard')}
                sx={{ px: 4, py: 1.5, fontWeight: 700 }}>
                Go to Dashboard
              </Button>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Box>
  )
}
