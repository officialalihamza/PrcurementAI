import { useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { motion }               from 'framer-motion'
import TuneIcon                 from '@mui/icons-material/Tune'
import { ContractFilters }      from '../components/contracts/ContractFilters'
import { ContractsList }        from '../components/contracts/ContractsList'
import { ContractDetail }       from '../components/contracts/ContractDetail'
import { useContracts }         from '../hooks/useContracts'
import { useContractStore }     from '../store/contractStore'

export default function Contracts() {
  const { data, isLoading, isFetching }      = useContracts()
  const { selectedContract, selectContract } = useContractStore()
  const [filterVisible, setFilterVisible]    = useState(true)

  const contracts = data?.contracts || []
  const total     = data?.total     || 0

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: 22, fontWeight: 800, color: '#1F3A5F' }}>
              Contract Search
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25, color: '#6C757D', fontSize: 12 }}>
              Search {total.toLocaleString()} UK public procurement contracts · Click any row for details
            </Typography>
          </Box>

          {!filterVisible && (
            <Button size="small" variant="outlined"
              startIcon={<TuneIcon sx={{ fontSize: 15 }} />}
              onClick={() => setFilterVisible(true)}
              sx={{ fontSize: 12, fontWeight: 600, textTransform: 'none',
                borderColor: '#e2e8f0', color: '#374151', height: 36,
                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' } }}>
              Show Filter
            </Button>
          )}
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <ContractFilters
          loading={isFetching}
          visible={filterVisible}
          onHide={() => setFilterVisible(false)}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <ContractsList contracts={contracts} total={total} loading={isLoading || isFetching} />
      </motion.div>

      <ContractDetail contract={selectedContract} onClose={() => selectContract(null)} />
    </Box>
  )
}
