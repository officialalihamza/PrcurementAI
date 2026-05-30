import { useState, useEffect } from 'react'
import {
  Box, Typography, Stepper, Step, StepLabel, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  Chip, OutlinedInput, Divider, Alert, CircularProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { companyApi, documentsApi } from '../services/api'
import { DocumentUpload }           from '../components/company/DocumentUpload'
import { useCompanyStore }          from '../store/companyStore'
import type { Company, CompanyDocument } from '../types'

const STEPS = ['Basic Info', 'Financial', 'Sectors & Geography', 'Experience & Certifications', 'Compliance & Docs']

const SECTORS = [
  'IT Services', 'Software', 'Construction', 'R&D Services', 'Health Services',
  'Architecture & Engineering', 'Education', 'Environmental Services',
  'Business Services', 'Transport', 'Financial Services',
]
const REGIONS = [
  'London', 'South East', 'North West', 'Yorkshire and the Humber',
  'West Midlands', 'East of England', 'Scotland', 'Wales',
  'North East', 'East Midlands', 'South West', 'Northern Ireland',
]
const LEGAL_STRUCTURES = ['Ltd', 'LLP', 'PLC', 'Sole Trader', 'Partnership', 'CIC', 'Charity']
const COVERAGES = [
  { value: 'local',          label: 'Local' },
  { value: 'regional',       label: 'Regional' },
  { value: 'multi-regional', label: 'Multi-Regional' },
  { value: 'national',       label: 'National' },
  { value: 'international',  label: 'International' },
]
const CERT_OPTIONS = ['ISO 9001', 'ISO 14001', 'ISO 27001', 'Cyber Essentials', 'Cyber Essentials Plus', 'Investors in People', 'Living Wage Employer']

type DraftCompany = Omit<Company, 'id' | 'user_id' | 'created_at'>

const emptyDraft = (): DraftCompany => ({
  name: '', company_number: '', sic_codes: [], postcode: '', region: '',
  employees: undefined, turnover: undefined,
  legal_structure: '', incorporation_date: '',
  primary_sectors: [], geographic_coverage: 'regional', regions_active: [],
  years_public_sector: 0, past_contract_count: 0, past_contract_total_value: undefined,
  certifications: [],
  has_iso_9001: false, has_iso_27001: false, has_cyber_essentials: false,
  has_modern_slavery: false, has_gdpr_docs: false, has_public_liability: false,
  turnover_latest: undefined, credit_rating: '',
  onboarding_completed: false, onboarding_step: 0,
})

const inputSx = {
  '& .MuiOutlinedInput-root': {
    fontSize: 13,
    '& fieldset': { borderColor: '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#94a3b8' },
    '&.Mui-focused fieldset': { borderColor: '#2563eb' },
  },
}

export default function EnhancedOnboarding() {
  const navigate   = useNavigate()
  const setCompany = useCompanyStore(s => s.setCompany)
  const [step, setStep]       = useState(0)
  const [draft, setDraft]     = useState<DraftCompany>(emptyDraft)
  const [docs, setDocs]       = useState<CompanyDocument[]>([])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    companyApi.get().then(({ data }) => {
      if (data.company) {
        const c = data.company as Company
        setDraft({ ...emptyDraft(), ...c })
        setStep(c.onboarding_step && c.onboarding_step < STEPS.length ? c.onboarding_step : 0)
      }
    }).catch(() => {}).finally(() => setLoaded(true))

    documentsApi.list().then(({ data }) => setDocs(data.documents || [])).catch(() => {})
  }, [])

  const set = <K extends keyof DraftCompany>(key: K, value: DraftCompany[K]) =>
    setDraft(d => ({ ...d, [key]: value }))

  const saveProgress = async (nextStep: number, completed = false): Promise<boolean> => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...draft, onboarding_step: nextStep, onboarding_completed: completed }
      await companyApi.upsert(payload)
      // Keep Zustand store in sync so RecommendedContracts sees the latest profile
      setCompany(payload as unknown as Record<string, unknown>)
      return true
    } catch (e: unknown) {
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Save failed.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    const next = step + 1
    const ok = await saveProgress(next)
    if (ok) setStep(next)
  }

  const handleBack = () => setStep(s => s - 1)

  const handleFinish = async () => {
    const ok = await saveProgress(STEPS.length, true)
    if (ok) navigate('/recommendations')
  }

  const toggleMulti = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]

  if (!loaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>
            Company Profile Setup
          </Typography>
          <Typography sx={{ mt: 0.5, color: '#6C757D', fontSize: 14 }}>
            Complete your profile to unlock personalised contract recommendations
          </Typography>
        </Box>
      </motion.div>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map(label => (
          <Step key={label}>
            <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 12 } }}>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>{error}</Alert>}

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', p: 3 }}>

          {/* ── Step 0: Basic Info ─────────────────────────────────────────── */}
          {step === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', mb: 0.5 }}>
                Basic Information
              </Typography>
              <TextField required label="Company Name" value={draft.name}
                onChange={e => set('name', e.target.value)} size="small" sx={inputSx} fullWidth />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Company Number" value={draft.company_number || ''}
                  onChange={e => set('company_number', e.target.value)} size="small" sx={{ ...inputSx, flex: 1 }} />
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel sx={{ fontSize: 13 }}>Legal Structure</InputLabel>
                  <Select label="Legal Structure" value={draft.legal_structure || ''}
                    onChange={e => set('legal_structure', e.target.value)} sx={{ fontSize: 13 }}>
                    <MenuItem value=""><em>Select…</em></MenuItem>
                    {LEGAL_STRUCTURES.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Incorporation Date" type="date" value={draft.incorporation_date || ''}
                  onChange={e => set('incorporation_date', e.target.value)} size="small"
                  sx={{ ...inputSx, flex: 1 }} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField label="Employees" type="number" value={draft.employees ?? ''}
                  onChange={e => set('employees', e.target.value ? Number(e.target.value) : undefined)}
                  size="small" sx={{ ...inputSx, flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Postcode" value={draft.postcode || ''}
                  onChange={e => set('postcode', e.target.value)} size="small" sx={{ ...inputSx, flex: 1 }} />
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel sx={{ fontSize: 13 }}>Primary Region</InputLabel>
                  <Select label="Primary Region" value={draft.region || ''}
                    onChange={e => set('region', e.target.value)} sx={{ fontSize: 13 }}>
                    <MenuItem value=""><em>Select…</em></MenuItem>
                    {REGIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}

          {/* ── Step 1: Financial ─────────────────────────────────────────── */}
          {step === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', mb: 0.5 }}>
                Financial Profile
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#64748b' }}>
                Used to match you with contracts proportionate to your capacity.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Annual Turnover (£)" type="number" value={draft.turnover_latest ?? ''}
                  onChange={e => set('turnover_latest', e.target.value ? Number(e.target.value) : undefined)}
                  size="small" sx={{ ...inputSx, flex: 1 }} />
                <TextField label="Previous Year Turnover (£)" type="number" value={draft.turnover ?? ''}
                  onChange={e => set('turnover', e.target.value ? Number(e.target.value) : undefined)}
                  size="small" sx={{ ...inputSx, flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Public Sector Contracts Won" type="number" value={draft.past_contract_count ?? ''}
                  onChange={e => set('past_contract_count', e.target.value ? Number(e.target.value) : undefined)}
                  size="small" sx={{ ...inputSx, flex: 1 }} />
                <TextField label="Total Past Contract Value (£)" type="number"
                  value={draft.past_contract_total_value ?? ''}
                  onChange={e => set('past_contract_total_value', e.target.value ? Number(e.target.value) : undefined)}
                  size="small" sx={{ ...inputSx, flex: 1 }} />
              </Box>
              <FormControl size="small" sx={{ maxWidth: 240 }}>
                <InputLabel sx={{ fontSize: 13 }}>Credit Rating</InputLabel>
                <Select label="Credit Rating" value={draft.credit_rating || ''}
                  onChange={e => set('credit_rating', e.target.value)} sx={{ fontSize: 13 }}>
                  <MenuItem value=""><em>Unknown</em></MenuItem>
                  {['Excellent', 'Good', 'Fair', 'Poor'].map(r =>
                    <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* ── Step 2: Sectors & Geography ───────────────────────────────── */}
          {step === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', mb: 0.5 }}>
                Sectors & Geography
              </Typography>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.75 }}>
                  Primary Sectors (select all that apply)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {SECTORS.map(s => {
                    const active = (draft.primary_sectors || []).includes(s)
                    return (
                      <Chip key={s} label={s} size="small" onClick={() =>
                        set('primary_sectors', toggleMulti(draft.primary_sectors || [], s))}
                        sx={{ fontSize: 11, fontWeight: 500, cursor: 'pointer',
                          bgcolor: active ? '#1d4ed8' : '#f1f5f9',
                          color:   active ? '#fff'    : '#475569',
                          '&:hover': { bgcolor: active ? '#1e40af' : '#e2e8f0' } }}
                      />
                    )
                  })}
                </Box>
              </Box>
              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.75 }}>
                  SIC Codes (comma separated)
                </Typography>
                <TextField
                  placeholder="e.g. 62020, 63110"
                  value={(draft.sic_codes || []).join(', ')}
                  onChange={e => set('sic_codes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  size="small" fullWidth sx={inputSx} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ flex: 1 }}>
                  <InputLabel sx={{ fontSize: 13 }}>Geographic Coverage</InputLabel>
                  <Select label="Geographic Coverage" value={draft.geographic_coverage || 'regional'}
                    onChange={e => set('geographic_coverage', e.target.value)} sx={{ fontSize: 13 }}>
                    {COVERAGES.map(c => <MenuItem key={c.value} value={c.value} sx={{ fontSize: 13 }}>{c.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.75 }}>
                  Active Regions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {REGIONS.map(r => {
                    const active = (draft.regions_active || []).includes(r)
                    return (
                      <Chip key={r} label={r} size="small" onClick={() =>
                        set('regions_active', toggleMulti(draft.regions_active || [], r))}
                        sx={{ fontSize: 11, cursor: 'pointer',
                          bgcolor: active ? '#0f766e' : '#f1f5f9',
                          color:   active ? '#fff'    : '#475569',
                          '&:hover': { bgcolor: active ? '#0d9488' : '#e2e8f0' } }}
                      />
                    )
                  })}
                </Box>
              </Box>
            </Box>
          )}

          {/* ── Step 3: Experience & Certifications ───────────────────────── */}
          {step === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', mb: 0.5 }}>
                Experience & Certifications
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="Years in Public Sector" type="number"
                  value={draft.years_public_sector ?? ''}
                  onChange={e => set('years_public_sector', e.target.value ? Number(e.target.value) : 0)}
                  size="small" sx={{ ...inputSx, flex: 1 }} slotProps={{ htmlInput: { min: 0, max: 50 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.75 }}>
                  Certifications Held
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {CERT_OPTIONS.map(c => {
                    const active = (draft.certifications || []).includes(c)
                    return (
                      <Chip key={c} label={c} size="small" onClick={() =>
                        set('certifications', toggleMulti(draft.certifications || [], c))}
                        sx={{ fontSize: 11, cursor: 'pointer',
                          bgcolor: active ? '#7c3aed' : '#f1f5f9',
                          color:   active ? '#fff'    : '#475569',
                          '&:hover': { bgcolor: active ? '#6d28d9' : '#e2e8f0' } }}
                      />
                    )
                  })}
                </Box>
              </Box>
              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.5 }}>
                  Key Certifications (tick those you hold)
                </Typography>
                {([
                  ['has_iso_9001',         'ISO 9001 — Quality Management'],
                  ['has_iso_27001',        'ISO 27001 — Information Security'],
                  ['has_cyber_essentials', 'Cyber Essentials / Cyber Essentials Plus'],
                ] as [keyof DraftCompany, string][]).map(([key, label]) => (
                  <FormControlLabel key={key}
                    control={
                      <Checkbox size="small" checked={Boolean(draft[key])}
                        onChange={e => set(key, e.target.checked as DraftCompany[typeof key])} />
                    }
                    label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
                    sx={{ display: 'flex', mb: 0.25 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* ── Step 4: Compliance & Documents ────────────────────────────── */}
          {step === 4 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', mb: 0.5 }}>
                Compliance & Documents
              </Typography>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 0.5 }}>
                  Compliance Policies (tick those you have in place)
                </Typography>
                {([
                  ['has_gdpr_docs',       'GDPR / Data Protection Policy'],
                  ['has_modern_slavery',  'Modern Slavery Statement'],
                  ['has_public_liability','Public Liability Insurance (£5M+)'],
                ] as [keyof DraftCompany, string][]).map(([key, label]) => (
                  <FormControlLabel key={key}
                    control={
                      <Checkbox size="small" checked={Boolean(draft[key])}
                        onChange={e => set(key, e.target.checked as DraftCompany[typeof key])} />
                    }
                    label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
                    sx={{ display: 'flex', mb: 0.25 }}
                  />
                ))}
              </Box>
              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151', mb: 1 }}>
                  Upload Supporting Documents
                </Typography>
                <DocumentUpload
                  documents={docs}
                  onUploaded={doc => setDocs(d => [doc, ...d])}
                  onDeleted={id => {
                    documentsApi.delete(id).catch(() => {})
                    setDocs(d => d.filter(x => x.id !== id))
                  }}
                />
              </Box>
            </Box>
          )}

        </Box>
      </motion.div>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" onClick={step === 0 ? () => navigate('/dashboard') : handleBack}
          sx={{ fontSize: 13, textTransform: 'none', borderColor: '#e2e8f0', color: '#475569' }}>
          {step === 0 ? 'Skip for now' : 'Back'}
        </Button>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {saving && <CircularProgress size={18} sx={{ color: '#1d4ed8' }} />}
          {step < STEPS.length - 1 ? (
            <Button variant="contained" onClick={handleNext} disabled={saving || !draft.name}
              sx={{ fontSize: 13, fontWeight: 600, textTransform: 'none',
                bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' }, borderRadius: 2, px: 3 }}>
              Save & Continue
            </Button>
          ) : (
            <Button variant="contained" onClick={handleFinish} disabled={saving}
              sx={{ fontSize: 13, fontWeight: 600, textTransform: 'none',
                bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, borderRadius: 2, px: 3 }}>
              Complete Profile
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  )
}
