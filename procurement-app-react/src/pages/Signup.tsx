import { useState } from 'react'
import { Box, Paper, Typography, TextField, Button, Alert, Divider } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setError(''); setLoading(true)
    try {
      await signup(email, password)
      navigate('/onboarding')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    }
    setLoading(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0F2F5', p: 2 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e8edf3', width: 400, maxWidth: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 3, mx: 'auto', mb: 2,
              background: 'linear-gradient(135deg, #2E75B6, #1F3A5F)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>P</Typography>
            </Box>
            <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 800 }}>Create account</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>Join ProcurementAI — free to start</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              required fullWidth size="small" sx={{ '& input': { fontSize: 13 } }} />
            <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              required fullWidth size="small" sx={{ '& input': { fontSize: 13 } }} />
            <TextField label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              required fullWidth size="small" sx={{ '& input': { fontSize: 13 } }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ mt: 1, py: 1.5, fontWeight: 700, fontSize: 14 }}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2E75B6', fontWeight: 600 }}>Sign in</Link>
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  )
}
