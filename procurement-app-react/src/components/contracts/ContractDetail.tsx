import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Chip, Button, Divider, IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
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

function sourceLabel(source?: string) {
  if (source === 'find-a-tender')  return { label: 'Find a Tender', url: 'https://www.find-tender.service.gov.uk' }
  if (source === 'spend-data')     return { label: 'data.gov.uk',   url: 'https://data.gov.uk' }
  return                                  { label: 'Contracts Finder', url: 'https://www.contractsfinder.service.gov.uk' }
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

  const smeFlag = contract.sme_flag ?? contract.smeFlag
  const docs = contract.documents || []
  const src = sourceLabel(contract.source)

  // Prefer the contract's own url, fall back to CF notice URL
  const viewUrl = contract.url || (contract.ocid
    ? `https://www.contractsfinder.service.gov.uk/Notice/${contract.ocid}`
    : null)

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
        {/* Status chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {smeFlag === true && (
            <Chip label="SME Suitable" size="small" sx={{ bgcolor: '#d4edda', color: '#155724', fontWeight: 700, fontSize: 11 }} />
          )}
          {smeFlag === false && (
            <Chip label="Large Only" size="small" sx={{ bgcolor: '#f8d7da', color: '#721C24', fontWeight: 700, fontSize: 11 }} />
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

        {/* Key fields grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5, mb: 2 }}>
          {[
            { label: 'Buyer',          value: contract.buyer },
            { label: 'Supplier',       value: contract.supplier || '—' },
            { label: 'Value',          value: fmt(contract.value) },
            { label: 'Region',         value: contract.region || '—' },
            { label: 'Deadline',       value: contract.deadline  ? new Date(contract.deadline).toLocaleDateString('en-GB')  : '—' },
            { label: 'Published',      value: contract.published ? new Date(contract.published).toLocaleDateString('en-GB') : '—' },
            { label: 'Source',         value: contract.source || '—' },
            { label: 'CPV Code',       value: contract.cpv_code || contract.cpvCode || '—' },
            { label: 'Authority Type', value: contract.authority_type || '—' },
          ].map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="caption" sx={{ color: '#6C757D', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
                {label}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#1F3A5F', fontWeight: 500 }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {/* Description */}
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

        {/* Documents */}
        {docs.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" sx={{ color: '#6C757D', textTransform: 'uppercase', fontSize: 10, fontWeight: 600 }}>
                Documents
              </Typography>
              <Chip label={docs.length} size="small"
                sx={{ height: 18, fontSize: 10, fontFamily: 'monospace', bgcolor: '#dbeafe', color: '#1d4ed8' }} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {docs.map((doc, i) => (
                <Box
                  key={doc.url || i}
                  component="a"
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.25,
                    borderRadius: 2, border: '1px solid #e8edf3', textDecoration: 'none',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: '#eff6ff', borderColor: '#bfdbfe' },
                  }}
                >
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, color: '#6C757D', flexShrink: 0, mt: 0.1 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#1F3A5F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.label || doc.type || 'Document'}
                    </Typography>
                    {doc.title && doc.title !== doc.label && (
                      <Typography sx={{ fontSize: 11, color: '#6C757D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.title}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 10, color: '#3b82f6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.url}
                    </Typography>
                  </Box>
                  <OpenInNewIcon sx={{ fontSize: 13, color: '#9ca3af', flexShrink: 0, mt: 0.3, '&:hover': { color: '#3b82f6' } }} />
                </Box>
              ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button startIcon={<BookmarkBorderIcon />} variant="outlined" size="small"
          onClick={handleSave} disabled={saving} sx={{ fontSize: 12 }}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {viewUrl && (
          <Button startIcon={<OpenInNewIcon />} variant="contained" size="small"
            href={viewUrl} target="_blank" rel="noopener" sx={{ fontSize: 12 }}>
            View on {src.label}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} size="small" sx={{ fontSize: 12 }}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
