import { useState } from 'react'
import {
  Box, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, ToggleButtonGroup, ToggleButton,
  Collapse, InputAdornment, Typography, CircularProgress,
} from '@mui/material'
import SearchIcon         from '@mui/icons-material/Search'
import TuneIcon           from '@mui/icons-material/Tune'
import RestartAltIcon     from '@mui/icons-material/RestartAlt'
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore'
import ExpandLessIcon     from '@mui/icons-material/ExpandLess'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useContractStore } from '../../store/contractStore'

const SECTORS = [
  '', 'IT Services', 'Construction', 'R&D Services', 'Health Services',
  'Architecture & Engineering', 'Education', 'Environmental Services',
  'Business Services', 'Transport', 'Financial Services', 'Software',
]
const REGIONS = [
  '', 'London', 'South East', 'North West', 'Yorkshire and the Humber',
  'West Midlands', 'East of England', 'Scotland', 'Wales',
  'North East', 'East Midlands', 'South West', 'Northern Ireland',
]

const inputSx = {
  height: 38, bgcolor: '#f8fafc',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#94a3b8' },
  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
}
const selectSx = {
  fontSize: 13, height: 38, bgcolor: '#f8fafc',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
}
const toggleSx = {
  height: 38, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5,
  '& .MuiToggleButton-root': {
    border: 'none', fontSize: 12, px: 1.75, fontWeight: 500, color: '#64748b',
    '&.Mui-selected': { bgcolor: '#1d4ed8', color: '#fff' },
  },
}

interface Props {
  loading: boolean
  visible: boolean
  onHide: () => void
}

export function ContractFilters({ loading, visible, onHide }: Props) {
  const { filters, applyFilters, resetFilters } = useContractStore()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [draft, setDraft] = useState({
    q:         filters.q,
    sector:    filters.sector,
    region:    filters.region,
    sme_flag:  filters.sme_flag,
    status:    filters.status,
    min_value: filters.min_value,
    max_value: filters.max_value,
  })

  const set = (key: keyof typeof draft, value: string) =>
    setDraft(d => ({ ...d, [key]: value }))

  const handleApply = () => applyFilters(draft)

  const handleReset = () => {
    const cleared = { q: '', sector: '', region: '', sme_flag: '', status: 'active', min_value: '', max_value: '' }
    setDraft(cleared)
    resetFilters()
  }

  if (!visible) return null

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2.5, border: '1px solid #e2e8f0', p: 1.75, mb: 2 }}>

      {/* Header row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TuneIcon sx={{ fontSize: 15, color: '#374151' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F3A5F' }}>Filters</Typography>
        </Box>
        <Button size="small" onClick={onHide}
          sx={{ fontSize: 11, textTransform: 'none', color: '#6b7280', minWidth: 'auto', py: 0.25, px: 1,
            '&:hover': { bgcolor: '#f1f5f9', color: '#374151' } }}>
          Hide Filter
        </Button>
      </Box>

      {/* Main filter row */}
      <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Search */}
        <TextField
          placeholder="Keywords, buyers…" size="small"
          value={draft.q} onChange={(e) => set('q', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          sx={{ flex: '1 1 220px', '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 15, color: '#94a3b8' }} /></InputAdornment> } }}
        />

        {/* Sector */}
        <FormControl size="small" sx={{ minWidth: 145, flex: '0 0 auto' }}>
          <InputLabel sx={{ fontSize: 13 }}>Sector</InputLabel>
          <Select label="Sector" value={draft.sector} onChange={(e) => set('sector', e.target.value)}
            sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
            {SECTORS.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s || 'All sectors'}</MenuItem>)}
          </Select>
        </FormControl>

        {/* Region */}
        <FormControl size="small" sx={{ minWidth: 145, flex: '0 0 auto' }}>
          <InputLabel sx={{ fontSize: 13 }}>Region</InputLabel>
          <Select label="Region" value={draft.region} onChange={(e) => set('region', e.target.value)}
            sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
            {REGIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r || 'All regions'}</MenuItem>)}
          </Select>
        </FormControl>

        {/* Status */}
        <ToggleButtonGroup value={draft.status} exclusive size="small"
          onChange={(_, v) => v !== null && set('status', v)} sx={toggleSx}>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="">All</ToggleButton>
        </ToggleButtonGroup>

        {/* SME */}
        <ToggleButtonGroup value={draft.sme_flag} exclusive size="small"
          onChange={(_, v) => v !== null && set('sme_flag', v)} sx={toggleSx}>
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="true" sx={{ '&.Mui-selected': { bgcolor: '#15803d !important', color: '#fff !important' } }}>SME</ToggleButton>
          <ToggleButton value="false" sx={{ '&.Mui-selected': { bgcolor: '#b91c1c !important', color: '#fff !important' } }}>Large</ToggleButton>
        </ToggleButtonGroup>

        {/* Show / Hide Advanced */}
        <Button size="small" onClick={() => setShowAdvanced(v => !v)}
          endIcon={showAdvanced ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
          sx={{ height: 38, textTransform: 'none', fontSize: 12, color: '#1d4ed8', px: 1,
            border: '1px solid #dbeafe', bgcolor: '#eff6ff', borderRadius: 1.5,
            '&:hover': { bgcolor: '#dbeafe' } }}>
          {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        </Button>

        {/* Apply */}
        <Button variant="contained" size="small" onClick={handleApply} disabled={loading}
          startIcon={loading ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : null}
          sx={{ height: 38, px: 2, fontSize: 13, fontWeight: 700, textTransform: 'none',
            bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' },
            boxShadow: '0 2px 6px rgba(29,78,216,0.25)', borderRadius: 1.5 }}>
          {loading ? 'Applying…' : 'Apply Filters'}
        </Button>

        {/* Reset — orange */}
        <Button size="small" onClick={handleReset}
          startIcon={<RestartAltIcon sx={{ fontSize: 15 }} />}
          sx={{ height: 38, px: 1.5, fontSize: 12, fontWeight: 600, textTransform: 'none',
            color: '#ea580c', border: '1px solid #fed7aa', bgcolor: '#fff7ed',
            '&:hover': { bgcolor: '#ffedd5', borderColor: '#fdba74' }, borderRadius: 1.5 }}>
          Reset Filter
        </Button>
      </Box>

      {/* Advanced row */}
      <Collapse in={showAdvanced}>
        <Box sx={{ display: 'flex', gap: 1.25, mt: 1.25, pt: 1.25, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          <TextField label="Min Value (£)" type="number" size="small"
            value={draft.min_value} onChange={(e) => set('min_value', e.target.value)}
            sx={{ width: 160, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }} />
          <TextField label="Max Value (£)" type="number" size="small"
            value={draft.max_value} onChange={(e) => set('max_value', e.target.value)}
            sx={{ width: 160, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }} />
        </Box>
      </Collapse>
    </Box>
  )
}
