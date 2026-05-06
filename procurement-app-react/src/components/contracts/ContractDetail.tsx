import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Chip, Button, Divider, IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import type { Contract } from '../../types'
import { contractsApi } from '../../services/api'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface Props { contract: Contract | null; onClose: () => void }

function fmt(v?: number) {
  if (!v) return '—'
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}k`
  return `£${v}`
}

export function ContractDetail({ contract, onClose }: Props) {
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)

  if (!contract) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await contractsApi.save(contract as unknown as Record<string, unknown>)
      qc.invalidateQueries({ queryKey: ['saved-contracts'] })
    } catch {}
    setSaving(false)
  }

  return (
    <Dialog open={Boolean(contract)} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ pb: 1, pr: 6 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F3A5F', lineHeight: 1.3 }}>
          {contract.title}
        </Typography>
        <IconButton onClick={onClose} size="small"
          sx={{ position: 'absolute', right: 12, top: 12, color: '#6C757D' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {contract.smeFlag === true && (
            <Chip label="SME" size="small" sx={{ bgcolor: '#d4edda', color: '#155724', fontWeight: 700, fontSize: 11 }} />
          )}
          {contract.smeFlag === false && (
            <Chip label="Large" size="small" sx={{ bgcolor: '#f8d7da', color: '#721C24', fontWeight: 700, fontSize: 11 }} />
          )}
          {contract.sector && (
            <Chip label={contract.sector} size="small" sx={{ bgcolor: '#e8edf3', color: '#1F3A5F', fontSize: 11 }} />
          )}
          {contract.status && (
            <Chip label={contract.status} size="small"
              sx={{ bgcolor: contract.status === 'active' ? '#d4edda' : '#f0f2f5', fontSize: 11,
                color: contract.status === 'active' ? '#155724' : '#6C757D' }} />
          )}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          {[
            { label: 'Buyer', value: contract.buyer },
            { label: 'Supplier', value: contract.supplier || '—' },
            { label: 'Value', value: fmt(contract.value) },
            { label: 'Region', value: contract.region || '—' },
            { label: 'Deadline', value: contract.deadline ? new Date(contract.deadline).toLocaleDateString('en-GB') : '—' },
            { label: 'Published', value: contract.published ? new Date(contract.published).toLocaleDateString('en-GB') : '—' },
            { label: 'Source', value: contract.source || '—' },
            { label: 'CPV Code', value: contract.cpvCode || '—' },
          ].map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="caption" sx={{ color: '#6C757D', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
                {label}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#1F3A5F', fontWeight: 500 }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {contract.description && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" sx={{ color: '#6C757D', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
              Description
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#374151', mt: 0.5, lineHeight: 1.6 }}>
              {contract.description}
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button startIcon={<BookmarkBorderIcon />} variant="outlined" size="small"
          onClick={handleSave} disabled={saving} sx={{ fontSize: 12 }}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {contract.ocid && (
          <Button startIcon={<OpenInNewIcon />} variant="contained" size="small"
            href={`https://www.contractsfinder.service.gov.uk/Notice/${contract.ocid}`}
            target="_blank" rel="noopener" sx={{ fontSize: 12 }}>
            View on CF
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} size="small" sx={{ fontSize: 12 }}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
