import { Box, Typography, Skeleton } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { motion } from 'framer-motion'
import { Paper } from '@mui/material'

interface KPIProps {
  title: string
  value: string
  change?: string
  positive?: boolean
  icon: React.ReactNode
  color: string
  delay?: number
}

function KPICard({ title, value, change, positive, icon, color, delay = 0 }: KPIProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Paper elevation={0} sx={{
        p: 2.5, borderRadius: 3, border: '1px solid #e8edf3',
        position: 'relative', overflow: 'hidden',
        '&:hover': { boxShadow: '0 6px 20px rgba(31,58,95,0.12)', transform: 'translateY(-2px)', transition: 'all 0.2s' },
        transition: 'all 0.2s',
      }}>
        <Box sx={{
          position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 12px 0 80px',
          bgcolor: color, opacity: 0.08,
        }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#6C757D', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, fontSize: 10 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: 28, color: '#1F3A5F', mt: 0.5, lineHeight: 1 }}>
              {value}
            </Typography>
            {change && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {positive
                  ? <TrendingUpIcon sx={{ fontSize: 14, color: '#155724' }} />
                  : <TrendingDownIcon sx={{ fontSize: 14, color: '#721C24' }} />}
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: positive ? '#155724' : '#721C24' }}>
                  {change}
                </Typography>
                <Typography variant="caption" color="text.secondary">vs last month</Typography>
              </Box>
            )}
          </Box>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2,
            bgcolor: color, opacity: 0.12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ color, opacity: 0.8, '& svg': { fontSize: 22 } }}>{icon}</Box>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  )
}

interface Props {
  data?: {
    total_contracts?: number
    sme_rate?: number
    avg_value?: number
    growth_rate?: number
  }
  loading?: boolean
}

export function KPICards({ data, loading }: Props) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {[0,1,2,3].map(i => (
          <Paper key={i} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3' }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="50%" height={36} sx={{ mt: 1 }} />
            <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
          </Paper>
        ))}
      </Box>
    )
  }

  const cards = [
    {
      title: 'Total Contracts',
      value: (data?.total_contracts ?? 0).toLocaleString(),
      change: '+8.2%', positive: true,
      icon: <AssignmentOutlinedIcon />, color: '#2E75B6',
    },
    {
      title: 'SME Win Rate',
      value: `${(data?.sme_rate ?? 41.5).toFixed(1)}%`,
      change: '+2.3%', positive: true,
      icon: <BusinessOutlinedIcon />, color: '#155724',
    },
    {
      title: 'Avg Contract Value',
      value: `£${((data?.avg_value ?? 0) / 1000).toFixed(0)}k`,
      change: '-1.4%', positive: false,
      icon: <AttachMoneyIcon />, color: '#856404',
    },
    {
      title: 'Growth Rate',
      value: `${(data?.growth_rate ?? 12.5).toFixed(1)}%`,
      change: '+5.1%', positive: true,
      icon: <ShowChartIcon />, color: '#1F3A5F',
    },
  ]

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      {cards.map((c, i) => <KPICard key={c.title} {...c} delay={i * 0.08} />)}
    </Box>
  )
}
