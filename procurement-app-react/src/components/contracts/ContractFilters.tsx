import { useState } from 'react'
import {
  Box, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, ToggleButtonGroup, ToggleButton,
  Collapse, InputAdornment, Chip,
} from '@mui/material'
import SearchIcon            from '@mui/icons-material/Search'
import TuneIcon              from '@mui/icons-material/Tune'
import CloseIcon             from '@mui/icons-material/Close'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useContractStore }  from '../../store/contractStore'

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
  height: 40, bgcolor: '#f8fafc',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#94a3b8' },
  '&.Mui-focused fieldset': { borderColor: '#2563eb' },
}

const selectSx = {
  fontSize: 13, height: 40, bgcolor: '#f8fafc',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2563eb' },
}

export function ContractFilters() {
  const { filters, applyFilters, resetFilters } = useContractStore()
  const [showMore, setShowMore] = useState(false)

  // Local draft — only committed to the store when Apply is clicked
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

  const handleApply = () => {
    applyFilters(draft)
  }

  const handleClear = () => {
    const cleared = { q: '', sector: '', region: '', sme_flag: '', status: 'active', min_value: '', max_value: '' }
    setDraft(cleared)
    resetFilters()
  }

  const extraActive = [draft.min_value, draft.max_value].filter(Boolean).length

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', p: 2, mb: 2.5 }}>

      {/* Row 1 */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Search */}
        <TextField
          placeholder="Search contracts, buyers, keywords…"
          size="small"
          value={draft.q}
          onChange={(e) => set('q', e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          sx={{ flex: '1 1 240px', '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: '#94a3b8' }} /></InputAdornment> } }}
        />

        {/* Sector */}
        <FormControl size="small" sx={{ minWidth: 155, flex: '0 0 auto' }}>
          <InputLabel sx={{ fontSize: 13 }}>Sector</InputLabel>
          <Select label="Sector" value={draft.sector}
            onChange={(e) => set('sector', e.target.value)}
            sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
            {SECTORS.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s || 'All sectors'}</MenuItem>)}
          </Select>
        </FormControl>

        {/* Region */}
        <FormControl size="small" sx={{ minWidth: 155, flex: '0 0 auto' }}>
          <InputLabel sx={{ fontSize: 13 }}>Region</InputLabel>
          <Select label="Region" value={draft.region}
            onChange={(e) => set('region', e.target.value)}
            sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
          {REGIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r || 'All regions'}</MenuItem>)}
          </Select>
        </FormControl>

        {/* SME toggle */}
        <ToggleButtonGroup
          value={draft.sme_flag} exclusive size="small"
          onChange={(_, v) => v !== null && set('sme_flag', v)}
          sx={{ height: 40, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2,
            '& .MuiToggleButton-root': { border: 'none', fontSize: 12, px: 1.75, fontWeight: 500, color: '#64748b',
              '&.Mui-selected': { bgcolor: '#1d4ed8', color: '#fff' } },
          }}
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="true"  sx={{ '&.Mui-selected': { bgcolor: '#15803d !important', color: '#fff !important' } }}>SME</ToggleButton>
          <ToggleButton value="false" sx={{ '&.Mui-selected': { bgcolor: '#b91c1c !important', color: '#fff !important' } }}>Large</ToggleButton>
        </ToggleButtonGroup>

        {/* Status toggle */}
        <ToggleButtonGroup
          value={draft.status} exclusive size="small"
          onChange={(_, v) => v !== null && set('status', v)}
          sx={{ height: 40, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2,
            '& .MuiToggleButton-root': { border: 'none', fontSize: 12, px: 1.75, fontWeight: 500, color: '#64748b',
              '&.Mui-selected': { bgcolor: '#1d4ed8', color: '#fff' } },
          }}
        >
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="">All</ToggleButton>
        </ToggleButtonGroup>

        {/* More */}
        <Button size="small" variant="outlined" startIcon={<TuneIcon sx={{ fontSize: 15 }} />}
          onClick={() => setShowMore(v => !v)}
          sx={{ height: 40, fontSize: 12, borderColor: '#e2e8f0', color: '#475569', textTransform: 'none',
            '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
          More
          {extraActive > 0 && (
            <Chip label={extraActive} size="small"
              sx={{ ml: 0.75, height: 18, fontSize: 10, bgcolor: '#1d4ed8', color: '#fff', fontWeight: 700 }} />
          )}
        </Button>

        {/* Clear */}
        <Button size="small" startIcon={<CloseIcon sx={{ fontSize: 15 }} />}
          onClick={handleClear}
          sx={{ height: 40, fontSize: 12, color: '#94a3b8', textTransform: 'none',
            '&:hover': { bgcolor: '#f8fafc', color: '#475569' } }}>
          Clear
        </Button>

        {/* Apply */}
        <Button
          variant="contained" size="small"
          onClick={handleApply}
          sx={{ height: 40, px: 2.5, fontSize: 13, fontWeight: 600, textTransform: 'none',
            bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1e40af' },
            boxShadow: '0 2px 8px rgba(29,78,216,0.3)', borderRadius: 2 }}
        >
          Apply Filters
        </Button>
      </Box>

      {/* Row 2: expanded */}
      <Collapse in={showMore}>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, pt: 1.5, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Min value (£)" type="number" size="small"
            value={draft.min_value}
            onChange={(e) => set('min_value', e.target.value)}
            sx={{ width: 150, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }}
          />
          <TextField
            label="Max value (£)" type="number" size="small"
            value={draft.max_value}
            onChange={(e) => set('max_value', e.target.value)}
            sx={{ width: 150, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': inputSx }}
          />
        </Box>
      </Collapse>
    </Box>
  )
}
