import { useState } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Alert,
  Tabs, Tab, Chip, Divider,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import BusinessOutlinedIcon          from '@mui/icons-material/BusinessOutlined'
import DeleteOutlinedIcon            from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon              from '@mui/icons-material/EditOutlined'
import { alertsApi, companyApi }     from '../services/api'
import type { Alert as AlertType, Company } from '../types'

// ── Alerts tab ────────────────────────────────────────────────────────────────

function AlertItem({ alert, onDelete }: { alert: AlertType; onDelete: (id: string) => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#fafbfc', mb: 1 }}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1F3A5F' }}>{alert.name}</Typography>
        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
          {(alert.keywords || []).map(k => (
            <Chip key={k} label={k} size="small"
              sx={{ fontSize: 10, height: 18, bgcolor: '#dbeafe', color: '#1d4ed8' }} />
          ))}
          {(alert.regions || []).map(r => (
            <Chip key={r} label={r} size="small"
              sx={{ fontSize: 10, height: 18, bgcolor: '#f1f5f9', color: '#475569' }} />
          ))}
        </Box>
      </Box>
      <Button size="small" onClick={() => onDelete(alert.id)}
        startIcon={<DeleteOutlinedIcon sx={{ fontSize: 14 }} />}
        sx={{ fontSize: 11, textTransform: 'none', color: '#ef4444',
          '&:hover': { bgcolor: '#fee2e2' }, minWidth: 'auto', ml: 1 }}>
        Delete
      </Button>
    </Box>
  )
}

function AlertsTab() {
  const qc = useQueryClient()
  const [form, setForm]       = useState({ name: '', keywords: '', regions: '' })
  const [success, setSuccess] = useState('')

  const { data: alerts = [] } = useQuery<AlertType[]>({
    queryKey: ['alerts'],
    queryFn: async () => { const { data } = await alertsApi.list(); return data.alerts || [] },
  })

  const createMut = useMutation({
    mutationFn: () => alertsApi.create({
      name: form.name,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      regions:  form.regions.split(',').map(r => r.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts'] })
      setForm({ name: '', keywords: '', regions: '' })
      setSuccess('Alert created.')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      fontSize: 13,
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#94a3b8' },
      '&.Mui-focused fieldset': { borderColor: '#2563eb' },
    },
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
      {/* Create */}
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1F3A5F', mb: 1.5 }}>
          Create Alert
        </Typography>
        {success && <Alert severity="success" sx={{ mb: 1.5, fontSize: 12 }}>{success}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <TextField label="Alert name" size="small" fullWidth value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} sx={inputSx} />
          <TextField label="Keywords (comma-separated)" size="small" fullWidth value={form.keywords}
            onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
            placeholder="IT services, software, cloud" sx={inputSx} />
          <TextField label="Regions (comma-separated, or blank for all)" size="small" fullWidth
            value={form.regions} onChange={e => setForm(f => ({ ...f, regions: e.target.value }))}
            placeholder="London, South East" sx={inputSx} />
          <Button variant="contained" onClick={() => createMut.mutate()}
            disabled={!form.name || createMut.isPending}
            sx={{ fontWeight: 700, fontSize: 13, textTransform: 'none',
              bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
            {createMut.isPending ? 'Creating…' : 'Create Alert'}
          </Button>
        </Box>
      </Box>

      {/* List */}
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#1F3A5F', mb: 1.5 }}>
          Active Alerts ({alerts.length})
        </Typography>
        {alerts.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 2 }}>
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 32, color: '#cbd5e1', mb: 0.5 }} />
            <Typography sx={{ fontSize: 13, color: '#94a3b8' }}>No alerts yet</Typography>
          </Box>
        ) : (
          alerts.map(a => <AlertItem key={a.id} alert={a} onDelete={id => deleteMut.mutate(id)} />)
        )}
      </Box>
    </Box>
  )
}

// ── Company Profile tab ───────────────────────────────────────────────────────

function CompanyProfileTab() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['company'],
    queryFn: async () => { const { data } = await companyApi.get(); return data.company as Company | null },
  })

  if (isLoading) return <Typography sx={{ color: '#94a3b8', fontSize: 13 }}>Loading…</Typography>

  if (!data) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <BusinessOutlinedIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>No company profile yet</Typography>
        <Typography sx={{ fontSize: 13, color: '#94a3b8', mt: 0.5, mb: 2 }}>
          Complete your profile to unlock personalised contract recommendations
        </Typography>
        <Button variant="contained" onClick={() => navigate('/profile-setup')}
          sx={{ fontWeight: 700, fontSize: 13, textTransform: 'none',
            bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
          Set Up Company Profile
        </Button>
      </Box>
    )
  }

  const rows: { label: string; value: string | number | undefined | null }[] = [
    { label: 'Company Name',      value: data.name },
    { label: 'Company Number',    value: data.company_number },
    { label: 'Legal Structure',   value: data.legal_structure },
    { label: 'Region',            value: data.region },
    { label: 'Postcode',          value: data.postcode },
    { label: 'Employees',         value: data.employees },
    { label: 'Annual Turnover',   value: data.turnover_latest ? `£${data.turnover_latest.toLocaleString()}` : undefined },
    { label: 'Geographic Coverage', value: data.geographic_coverage },
    { label: 'Years Public Sector', value: data.years_public_sector },
    { label: 'Past Contracts Won',  value: data.past_contract_count },
  ]

  const certs = [
    data.has_iso_9001        && 'ISO 9001',
    data.has_iso_27001       && 'ISO 27001',
    data.has_cyber_essentials && 'Cyber Essentials',
    data.has_gdpr_docs       && 'GDPR Policy',
    data.has_modern_slavery  && 'Modern Slavery',
    data.has_public_liability && 'Public Liability',
  ].filter(Boolean) as string[]

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1F3A5F' }}>{data.name}</Typography>
          {data.onboarding_completed ? (
            <Chip label="Profile complete" size="small"
              sx={{ fontSize: 11, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, mt: 0.5 }} />
          ) : (
            <Chip label="Profile incomplete" size="small"
              sx={{ fontSize: 11, bgcolor: '#fef9c3', color: '#a16207', fontWeight: 600, mt: 0.5 }} />
          )}
        </Box>
        <Button variant="outlined" startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
          onClick={() => navigate('/profile-setup')}
          sx={{ fontSize: 12, textTransform: 'none', borderColor: '#e2e8f0', color: '#475569' }}>
          Edit Profile
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3,1fr)' }, gap: 1.5, mb: 2.5 }}>
        {rows.filter(r => r.value !== undefined && r.value !== null && r.value !== '').map(r => (
          <Box key={r.label} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              {r.label}
            </Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#1F3A5F', mt: 0.25 }}>{r.value}</Typography>
          </Box>
        ))}
      </Box>

      {(data.primary_sectors || []).length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.75 }}>Primary Sectors</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {(data.primary_sectors || []).map(s => (
              <Chip key={s} label={s} size="small"
                sx={{ fontSize: 11, bgcolor: '#dbeafe', color: '#1d4ed8' }} />
            ))}
          </Box>
        </Box>
      )}

      {certs.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.75 }}>Compliance & Certifications</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {certs.map(c => (
              <Chip key={c} label={c} size="small"
                sx={{ fontSize: 11, bgcolor: '#dcfce7', color: '#15803d' }} />
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2.5 }} />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={() => navigate('/recommendations')}
          sx={{ fontSize: 12, fontWeight: 600, textTransform: 'none',
            bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' } }}>
          View Recommendations
        </Button>
        <Button variant="outlined" onClick={() => navigate('/profile-setup')}
          sx={{ fontSize: 12, textTransform: 'none', borderColor: '#e2e8f0', color: '#475569' }}>
          Edit Profile
        </Button>
      </Box>
    </Box>
  )
}

// ── Main Settings page ────────────────────────────────────────────────────────

export default function Settings() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F', mb: 2.5 }}>
          Settings
        </Typography>
      </motion.div>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v: number) => setTab(v)}
          sx={{ borderBottom: '1px solid #e8edf3', minHeight: 44, px: 1,
            '& .MuiTab-root': { minHeight: 44, fontSize: 13, fontWeight: 500, textTransform: 'none' },
            '& .Mui-selected': { fontWeight: 700 } }}>
          <Tab icon={<BusinessOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Company Profile" />
          <Tab icon={<NotificationsNoneOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Alerts" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && <CompanyProfileTab />}
          {tab === 1 && <AlertsTab />}
        </Box>
      </Paper>
    </Box>
  )
}
