import { useState } from 'react'
import {
  Box, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, ToggleButtonGroup, ToggleButton,
  Collapse, InputAdornment, Chip,
} from '@mui/material'
import SearchIcon        from '@mui/icons-material/Search'
import TuneIcon          from '@mui/icons-material/Tune'
import CloseIcon         from '@mui/icons-material/Close'
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

const selectSx = {
  fontSize: 13, height: 40, bgcolor: '#fff',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
}

export function ContractFilters() {
  const { filters, setFilter, resetFilters } = useContractStore()
  const [showMore, setShowMore] = useState(false)

  const activeExtraCount = [
    filters.min_value, filters.max_value,
  ].filter(Boolean).length

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #e2e8f0', p: 2, mb: 2.5 }}>

      {/* Row 1: search + dropdowns + toggles */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Search */}
        <TextField
          placeholder="Search contracts, buyers, keywords…"
          size="small"
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          sx={{ flex: '1 1 260px', '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': { height: 40, bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#94a3b8' } } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: '#94a3b8' }} /></InputAdornment> } }}
        />

        {/* Sector */}
        <FormControl size="small" sx={{ minWidth: 160, flex: '0 0 auto' }}>
          <InputLabel sx={{ fontSize: 13 }}>Sector</InputLabel>
          <Select label="Sector" value={filters.sector ?? ''}
            onChange={(e) => setFilter('sector', e.target.value)}
            sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
            {SECTORS.map(s => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s || 'All sectors'}</MenuItem>)}
          </Select>
        </FormControl>

        {/* Region */}
        <FormControl size="small" sx={{ minWidth: 160, flex: '0 0 auto' }}>
          <InputLabel sx={{ fontSize: 13 }}>Region</InputLabel>
          <Select label="Region" value={filters.region ?? ''}
            onChange={(e) => setFilter('region', e.target.value)}
            sx={selectSx} IconComponent={KeyboardArrowDownIcon}>
            {REGIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r || 'All regions'}</MenuItem>)}
          </Select>
        </FormControl>

        {/* SME toggle */}
        <ToggleButtonGroup
          value={filters.sme_flag ?? ''} exclusive size="small"
          onChange={(_, v) => setFilter('sme_flag', v ?? '')}
          sx={{ height: 40, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2,
            '& .MuiToggleButton-root': { border: 'none', fontSize: 12, px: 1.75, fontWeight: 500, color: '#64748b', '&.Mui-selected': { bgcolor: '#1d4ed8', color: '#fff' } },
          }}
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="true" sx={{ '&.Mui-selected': { bgcolor: '#15803d !important', color: '#fff !important' } }}>SME</ToggleButton>
          <ToggleButton value="false" sx={{ '&.Mui-selected': { bgcolor: '#b91c1c !important', color: '#fff !important' } }}>Large</ToggleButton>
        </ToggleButtonGroup>

        {/* Status toggle */}
        <ToggleButtonGroup
          value={filters.status ?? 'active'} exclusive size="small"
          onChange={(_, v) => setFilter('status', v ?? 'active')}
          sx={{ height: 40, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2,
            '& .MuiToggleButton-root': { border: 'none', fontSize: 12, px: 1.75, fontWeight: 500, color: '#64748b', '&.Mui-selected': { bgcolor: '#1d4ed8', color: '#fff' } },
          }}
        >
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="">All</ToggleButton>
        </ToggleButtonGroup>

        {/* More / Clear */}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
          <Button
            size="small" variant="outlined" startIcon={<TuneIcon sx={{ fontSize: 15 }} />}
            onClick={() => setShowMore(v => !v)}
            sx={{ height: 40, fontSize: 12, borderColor: '#e2e8f0', color: '#475569', textTransform: 'none',
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}
          >
            More filters
            {activeExtraCount > 0 && (
              <Chip label={activeExtraCount} size="small"
                sx={{ ml: 0.75, height: 18, fontSize: 10, bgcolor: '#1d4ed8', color: '#fff', fontWeight: 700 }} />
            )}
          </Button>
          <Button
            size="small" startIcon={<CloseIcon sx={{ fontSize: 15 }} />}
            onClick={resetFilters}
            sx={{ height: 40, fontSize: 12, color: '#94a3b8', textTransform: 'none',
              '&:hover': { bgcolor: '#f8fafc', color: '#475569' } }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {/* Row 2: expanded filters */}
      <Collapse in={showMore}>
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, pt: 1.5, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Min value (£)" type="number" size="small"
            value={filters.min_value ?? ''}
            onChange={(e) => setFilter('min_value', e.target.value)}
            sx={{ width: 150, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': { height: 40, '& fieldset': { borderColor: '#e2e8f0' } } }}
          />
          <TextField
            label="Max value (£)" type="number" size="small"
            value={filters.max_value ?? ''}
            onChange={(e) => setFilter('max_value', e.target.value)}
            sx={{ width: 150, '& input': { fontSize: 13 }, '& .MuiOutlinedInput-root': { height: 40, '& fieldset': { borderColor: '#e2e8f0' } } }}
          />
        </Box>
      </Collapse>
    </Box>
  )
}
