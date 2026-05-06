import { Box, Typography, Paper, TextField, Button, Divider, Switch, FormControlLabel, Alert } from '@mui/material'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { alertsApi, companyApi } from '../services/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Alert as AlertType } from '../types'

function AlertItem({ alert, onDelete }: { alert: AlertType; onDelete: (id: string) => void }) {
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e8edf3', mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{alert.name}</Typography>
          <Typography variant="caption" sx={{ color: '#6C757D' }}>
            Keywords: {alert.keywords?.join(', ') || '—'} · Regions: {alert.regions?.join(', ') || 'All'}
          </Typography>
        </Box>
        <Button size="small" color="error" onClick={() => onDelete(alert.id)} sx={{ fontSize: 11 }}>Delete</Button>
      </Box>
    </Paper>
  )
}

export default function Settings() {
  const qc = useQueryClient()
  const [newAlert, setNewAlert] = useState({ name: '', keywords: '', regions: '' })
  const [success, setSuccess] = useState('')

  const { data: alerts = [] } = useQuery<AlertType[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await alertsApi.list()
      return data.alerts || []
    },
  })

  const createMut = useMutation({
    mutationFn: () => alertsApi.create({
      name: newAlert.name,
      keywords: newAlert.keywords.split(',').map(k => k.trim()).filter(Boolean),
      regions: newAlert.regions.split(',').map(r => r.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      setNewAlert({ name: '', keywords: '', regions: '' })
      setSuccess('Alert created successfully')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, mb: 3 }}>Alerts & Settings</Typography>
      </motion.div>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Alerts */}
        <Box>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e8edf3', mb: 2 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Create Alert</Typography>
            {success && <Alert severity="success" sx={{ mb: 2, fontSize: 12 }}>{success}</Alert>}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <TextField label="Alert name" size="small" fullWidth value={newAlert.name}
                onChange={e => setNewAlert(a => ({ ...a, name: e.target.value }))} sx={{ '& input': { fontSize: 13 } }} />
              <TextField label="Keywords (comma-separated)" size="small" fullWidth value={newAlert.keywords}
                onChange={e => setNewAlert(a => ({ ...a, keywords: e.target.value }))}
                placeholder="IT services, software, cloud" sx={{ '& input': { fontSize: 13 } }} />
              <TextField label="Regions (comma-separated, or leave blank for all)" size="small" fullWidth
                value={newAlert.regions} onChange={e => setNewAlert(a => ({ ...a, regions: e.target.value }))}
                placeholder="London, South East" sx={{ '& input': { fontSize: 13 } }} />
              <Button variant="contained" onClick={() => createMut.mutate()} disabled={!newAlert.name || createMut.isPending}
                sx={{ mt: 0.5, fontWeight: 700 }}>
                {createMut.isPending ? 'Creating…' : 'Create Alert'}
              </Button>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e8edf3' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Active Alerts ({alerts.length})</Typography>
            {alerts.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#9ca3af', py: 2, textAlign: 'center' }}>
                No alerts yet. Create one above.
              </Typography>
            ) : (
              alerts.map(a => <AlertItem key={a.id} alert={a} onDelete={id => deleteMut.mutate(id)} />)
            )}
          </Paper>
        </Box>

        {/* Preferences */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e8edf3', alignSelf: 'flex-start' }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Notification Preferences</Typography>
          {[
            { label: 'Email alerts for new matching contracts', checked: true },
            { label: 'Weekly SME market digest', checked: false },
            { label: 'Deadline reminders (48h before)', checked: true },
          ].map(({ label, checked }) => (
            <FormControlLabel
              key={label} label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
              control={<Switch defaultChecked={checked} size="small" />}
              sx={{ display: 'flex', mb: 1 }}
            />
          ))}
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontWeight: 600, mb: 1.5, color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
            Danger Zone
          </Typography>
          <Button variant="outlined" color="error" size="small" sx={{ fontSize: 12 }}>
            Delete account
          </Button>
        </Paper>
      </Box>
    </Box>
  )
}
