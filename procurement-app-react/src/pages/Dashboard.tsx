import { Box, Typography, IconButton, Paper, Tooltip } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { motion } from 'framer-motion'
import { KPICards } from '../components/dashboard/KPICards'
import { SMEByRegionChart } from '../components/dashboard/SMEByRegionChart'
import { SMEOverTimeChart } from '../components/dashboard/SMEOverTimeChart'
import { ValueBandChart } from '../components/dashboard/ValueBandChart'
import { TopSectorsChart } from '../components/dashboard/TopSectorsChart'
import { useDashboardStats } from '../hooks/useAnalytics'

export default function Dashboard() {
  const { data, isLoading, refetch, dataUpdatedAt } = useDashboardStats()

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>Dashboard</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
              Real-time UK public procurement market intelligence
              {lastUpdated && ` · Updated ${lastUpdated}`}
            </Typography>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()} size="small" sx={{ mt: 0.5, color: '#2E75B6', bgcolor: '#e8edf3', borderRadius: 2 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      {/* KPIs */}
      <KPICards data={data} loading={isLoading} />

      {/* Charts row 1 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', height: '100%' }}>
            <SMEByRegionChart data={data?.by_region} loading={isLoading} />
          </Paper>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', height: '100%' }}>
            <SMEOverTimeChart data={data?.by_month} loading={isLoading} />
          </Paper>
        </motion.div>
      </Box>

      {/* Charts row 2 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.36 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', height: '100%' }}>
            <ValueBandChart data={data?.by_value_band} loading={isLoading} />
          </Paper>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.44 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', height: '100%' }}>
            <TopSectorsChart data={data?.top_sectors} loading={isLoading} />
          </Paper>
        </motion.div>
      </Box>

      {/* Footnote */}
      <Box sx={{ mt: 3, px: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Data sourced from UK Contracts Finder, Find a Tender Service, Companies House & Spend Data — {(data?.total_contracts ?? 514875).toLocaleString()} contracts.
        </Typography>
      </Box>
    </Box>
  )
}
