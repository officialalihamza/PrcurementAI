import {
  Box, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, Divider, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import ClearIcon from '@mui/icons-material/Clear'
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

export function ContractFilters() {
  const { filters, setFilter, resetFilters } = useContractStore()

  return (
    <Box sx={{
      width: 240, flexShrink: 0, bgcolor: '#fff', borderRadius: 3,
      border: '1px solid #e8edf3', p: 2.5, alignSelf: 'flex-start',
      position: 'sticky', top: 80,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon sx={{ fontSize: 18, color: '#2E75B6' }} />
          <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600 }}>Filters</Typography>
        </Box>
        <Button size="small" startIcon={<ClearIcon />} onClick={resetFilters}
          sx={{ fontSize: 11, color: '#6C757D', minWidth: 0, px: 1 }}>
          Clear
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Search" placeholder="Keywords…" size="small" fullWidth
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          sx={{ '& input': { fontSize: 13 } }}
        />

        <FormControl size="small" fullWidth>
          <InputLabel sx={{ fontSize: 13 }}>Sector</InputLabel>
          <Select label="Sector" value={filters.sector} onChange={(e) => setFilter('sector', e.target.value)}
            sx={{ fontSize: 13 }}>
            {SECTORS.map((s) => <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s || 'All sectors'}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel sx={{ fontSize: 13 }}>Region</InputLabel>
          <Select label="Region" value={filters.region} onChange={(e) => setFilter('region', e.target.value)}
            sx={{ fontSize: 13 }}>
            {REGIONS.map((r) => <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r || 'All regions'}</MenuItem>)}
          </Select>
        </FormControl>

        <Divider />

        <Box>
          <Typography variant="caption" sx={{ color: '#6C757D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
            SME Status
          </Typography>
          <ToggleButtonGroup
            value={filters.sme_flag} exclusive size="small" fullWidth
            onChange={(_, v) => setFilter('sme_flag', v ?? '')}
            sx={{ mt: 1 }}
          >
            <ToggleButton value="" sx={{ fontSize: 11, py: 0.5 }}>All</ToggleButton>
            <ToggleButton value="true" sx={{ fontSize: 11, py: 0.5, '&.Mui-selected': { bgcolor: '#d4edda', color: '#155724' } }}>SME</ToggleButton>
            <ToggleButton value="false" sx={{ fontSize: 11, py: 0.5, '&.Mui-selected': { bgcolor: '#f8d7da', color: '#721C24' } }}>Large</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: '#6C757D', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 10 }}>
            Status
          </Typography>
          <ToggleButtonGroup
            value={filters.status} exclusive size="small" fullWidth
            onChange={(_, v) => setFilter('status', v ?? 'active')}
            sx={{ mt: 1 }}
          >
            <ToggleButton value="active" sx={{ fontSize: 11, py: 0.5 }}>Active</ToggleButton>
            <ToggleButton value="" sx={{ fontSize: 11, py: 0.5 }}>All</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <TextField
            label="Min £" type="number" size="small"
            value={filters.min_value}
            onChange={(e) => setFilter('min_value', e.target.value)}
            sx={{ '& input': { fontSize: 12 } }}
          />
          <TextField
            label="Max £" type="number" size="small"
            value={filters.max_value}
            onChange={(e) => setFilter('max_value', e.target.value)}
            sx={{ '& input': { fontSize: 12 } }}
          />
        </Box>
      </Box>
    </Box>
  )
}
