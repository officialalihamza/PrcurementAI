import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TableSortLabel, Chip, Box, Typography,
  TablePagination, Skeleton, Paper,
} from '@mui/material'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Contract } from '../../types'
import { useContractStore } from '../../store/contractStore'

function fmt(v?: number) {
  if (!v) return '—'
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}k`
  return `£${v}`
}

function fmtDate(d?: string) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch { return '—' }
}

interface Props { contracts: Contract[]; total: number; loading: boolean }

export function ContractsList({ contracts, total, loading }: Props) {
  const { filters, setFilter, selectContract } = useContractStore()
  const [orderBy, setOrderBy] = useState('published')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (col: string) => {
    if (orderBy === col) setOrder(o => o === 'asc' ? 'desc' : 'asc')
    else { setOrderBy(col); setOrder('desc') }
  }

  const ColHead = ({ id, label }: { id: string; label: string }) => (
    <TableCell sortDirection={orderBy === id ? order : false} sx={{ whiteSpace: 'nowrap' }}>
      <TableSortLabel active={orderBy === id} direction={orderBy === id ? order : 'asc'} onClick={() => handleSort(id)}>
        {label}
      </TableSortLabel>
    </TableCell>
  )

  // Resolve SME flag from either field name (API uses snake_case)
  const getSmeFlag = (c: Contract) => c.sme_flag ?? c.smeFlag ?? null

  if (loading) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', overflow: 'hidden' }}>
        {[...Array(10)].map((_, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, px: 2, py: 1.5, borderBottom: '1px solid #f0f2f5' }}>
            <Skeleton width="35%" height={16} /><Skeleton width="20%" height={16} />
            <Skeleton width="8%" height={16} /><Skeleton width="8%" height={16} />
          </Box>
        ))}
      </Paper>
    )
  }

  if (!contracts.length) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 32, mb: 1 }}>🔍</Typography>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#6C757D' }}>No contracts found</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: '#9ca3af' }}>Try adjusting your filters</Typography>
      </Paper>
    )
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
              <ColHead id="title" label="Title" />
              <ColHead id="buyer" label="Buyer" />
              <ColHead id="value" label="Value" />
              <ColHead id="region" label="Region" />
              <ColHead id="deadline" label="Deadline" />
              <TableCell sx={{ whiteSpace: 'nowrap' }}>SME</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', xl: 'table-cell' } }}>Source</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((c, i) => {
              const smeFlag = getSmeFlag(c)
              return (
                <TableRow
                  key={c.id || c.ocid || i}
                  hover
                  onClick={() => selectContract(c)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8faff' }, '&:last-child td': { border: 0 } }}
                  component={motion.tr as unknown as React.ElementType}
                  {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: Math.min(i * 0.015, 0.3) } }}
                >
                  {/* Title */}
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#1F3A5F', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                      {c.sector && (
                        <Typography variant="caption" sx={{ color: '#6C757D', fontSize: 10 }}>{c.sector}</Typography>
                      )}
                      {c.documents && c.documents.length > 0 && (
                        <Chip
                          label={`${c.documents.length} doc${c.documents.length !== 1 ? 's' : ''}`}
                          size="small"
                          sx={{ fontSize: 9, height: 16, bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 600, cursor: 'pointer' }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  {/* Buyer */}
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Typography sx={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.buyer}
                    </Typography>
                  </TableCell>

                  {/* Value */}
                  <TableCell>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                      color: c.value >= 5_000_000 ? '#721C24' : '#1F3A5F' }}>
                      {fmt(c.value)}
                    </Typography>
                  </TableCell>

                  {/* Region */}
                  <TableCell>
                    <Typography sx={{ fontSize: 11, whiteSpace: 'nowrap', color: '#6C757D' }}>{c.region || '—'}</Typography>
                  </TableCell>

                  {/* Deadline */}
                  <TableCell>
                    <Typography sx={{ fontSize: 11, whiteSpace: 'nowrap', color: '#6C757D' }}>{fmtDate(c.deadline)}</Typography>
                  </TableCell>

                  {/* SME flag */}
                  <TableCell>
                    {smeFlag === true && (
                      <Chip label="SME" size="small"
                        sx={{ bgcolor: '#d4edda', color: '#155724', fontWeight: 700, fontSize: 10, height: 20 }} />
                    )}
                    {smeFlag === false && (
                      <Chip label="Large" size="small"
                        sx={{ bgcolor: '#f8d7da', color: '#721C24', fontWeight: 700, fontSize: 10, height: 20 }} />
                    )}
                    {smeFlag === null && (
                      <Typography sx={{ fontSize: 10, color: '#9ca3af' }}>—</Typography>
                    )}
                  </TableCell>

                  {/* Source */}
                  <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>
                    {c.source && (
                      <Chip label={c.source.replace('contracts-finder','CF').replace('find-a-tender','FTS').replace('spend-data','Spend')}
                        size="small" sx={{ fontSize: 9, height: 18, bgcolor: '#f0f2f5', color: '#6C757D' }} />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div" count={total} page={filters.page - 1} rowsPerPage={20}
        rowsPerPageOptions={[20]}
        onPageChange={(_, p) => setFilter('page', p + 1)}
        sx={{ borderTop: '1px solid #f0f2f5', '& .MuiTablePagination-displayedRows': { fontSize: 12 } }}
      />
    </Paper>
  )
}
