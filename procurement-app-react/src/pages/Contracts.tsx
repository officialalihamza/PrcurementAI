import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { ContractFilters } from '../components/contracts/ContractFilters'
import { ContractsList }   from '../components/contracts/ContractsList'
import { ContractDetail }  from '../components/contracts/ContractDetail'
import { useContracts }    from '../hooks/useContracts'
import { useContractStore } from '../store/contractStore'

export default function Contracts() {
  const { data, isLoading, isFetching }  = useContracts()
  const { selectedContract, selectContract } = useContractStore()

  const contracts = data?.contracts || []
  const total     = data?.total     || 0

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>Contract Search</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
            Search {total.toLocaleString()} UK public procurement contracts · Click any row for details
          </Typography>
        </Box>
      </motion.div>

      {/* Filters — horizontal bar above the table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <ContractFilters />
      </motion.div>

      {/* Results table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <ContractsList contracts={contracts} total={total} loading={isLoading || isFetching} />
      </motion.div>

      <ContractDetail contract={selectedContract} onClose={() => selectContract(null)} />
    </Box>
  )
}
