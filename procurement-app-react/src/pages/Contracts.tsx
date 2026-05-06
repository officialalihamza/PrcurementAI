import { Box, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import { ContractFilters } from '../components/contracts/ContractFilters'
import { ContractsList } from '../components/contracts/ContractsList'
import { ContractDetail } from '../components/contracts/ContractDetail'
import { useContracts } from '../hooks/useContracts'
import { useContractStore } from '../store/contractStore'

export default function Contracts() {
  const { data, isLoading } = useContracts()
  const { selectedContract, selectContract } = useContractStore()

  const contracts = data?.contracts || []
  const total = data?.total || 0

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>Contract Search</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
            Search {total.toLocaleString()} UK public procurement contracts · Click any row for details
          </Typography>
        </Box>
      </motion.div>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          style={{ display: 'none' }}>
          {/* Filters hidden on mobile — shown via CSS on md+ */}
        </motion.div>

        <Box sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0 }}>
          <ContractFilters />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }}>
            <ContractsList contracts={contracts} total={total} loading={isLoading} />
          </motion.div>
        </Box>
      </Box>

      <ContractDetail contract={selectedContract} onClose={() => selectContract(null)} />
    </Box>
  )
}
