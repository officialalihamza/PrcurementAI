import { Box, Typography, IconButton, Paper, Tooltip, Skeleton, Button } from '@mui/material'
import RefreshIcon             from '@mui/icons-material/Refresh'
import AssignmentOutlinedIcon  from '@mui/icons-material/AssignmentOutlined'
import BusinessOutlinedIcon    from '@mui/icons-material/BusinessOutlined'
import TrendingUpIcon          from '@mui/icons-material/TrendingUp'
import AttachMoneyIcon         from '@mui/icons-material/AttachMoney'
import SearchIcon              from '@mui/icons-material/Search'
import StarBorderIcon          from '@mui/icons-material/StarBorder'
import { motion }              from 'framer-motion'
import { SMEByRegionChart }    from '../components/dashboard/SMEByRegionChart'
import { SMEOverTimeChart }    from '../components/dashboard/SMEOverTimeChart'
import { ValueBandChart }      from '../components/dashboard/ValueBandChart'
import { TopSectorsChart }     from '../components/dashboard/TopSectorsChart'
import { useDashboardStats }   from '../hooks/useAnalytics'
import { useNavigate }         from 'react-router-dom'

// ── Section header (Joblogic style) ──────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: 2.5, py: 1.25, bgcolor: '#1F3A5F',
      borderRadius: '10px 10px 0 0',
    }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </Typography>
      {action}
    </Box>
  )
}

// ── KPI stat card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ReactNode
  selected?: boolean
  loading?: boolean
}

function StatCard({ label, value, sub, color, icon, selected = false, loading }: StatCardProps) {
  if (loading) {
    return (
      <Box sx={{ flex: '1 1 0', p: 2, borderTop: `3px solid #e2e8f0`, borderRight: '1px solid #e8edf3',
        '&:last-child': { borderRight: 'none' } }}>
        <Skeleton width="60%" height={12} sx={{ mb: 1 }} />
        <Skeleton width="50%" height={32} />
        <Skeleton width="40%" height={12} sx={{ mt: 0.5 }} />
      </Box>
    )
  }
  return (
    <Box sx={{
      flex: '1 1 0', p: 2.5, cursor: 'default',
      borderTop: `3px solid ${selected ? color : '#e2e8f0'}`,
      borderRight: '1px solid #e8edf3',
      '&:last-child': { borderRight: 'none' },
      transition: 'all 0.15s',
      '&:hover': { bgcolor: '#f8fafc' },
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', mb: 0.75 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: selected ? color : '#1F3A5F', lineHeight: 1 }}>
            {value}
          </Typography>
          {sub && (
            <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 0.5 }}>{sub}</Typography>
          )}
        </Box>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: selected ? color : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'all 0.15s',
          '& svg': { fontSize: 18, color: selected ? '#fff' : color } }}>
          {icon}
        </Box>
      </Box>
    </Box>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, action, children, delay = 0 }: {
  title: string; action?: React.ReactNode; children: React.ReactNode; delay?: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }}>
      <Box sx={{ border: '1px solid #e8edf3', borderRadius: '10px', overflow: 'hidden', mb: 2.5 }}>
        <SectionHeader title={title} action={action} />
        {children}
      </Box>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, isLoading, refetch, dataUpdatedAt } = useDashboardStats()

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null

  const kpis           = data?.kpis
  const charts         = data?.charts
  const totalContracts = (kpis?.total_fetched ?? 0).toLocaleString()
  const smeRate        = `${(kpis?.sme_rate    ?? 41.5).toFixed(1)}%`
  const avgValue       = `£${((kpis?.avg_value ?? 0) / 1000).toFixed(0)}K`
  const growthRate     = `+${(kpis?.week_count ?? 12).toFixed(0)} this week`

  return (
    <Box>
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h2" sx={{ fontSize: 26, fontWeight: 800, color: '#1F3A5F' }}>Analytical Dashboard</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: '#6C757D' }}>
              Real-time UK public procurement market intelligence
              {lastUpdated && ` · Updated ${lastUpdated}`}
            </Typography>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={() => refetch()} size="small"
              sx={{ mt: 0.5, color: '#2E75B6', bgcolor: '#e8edf3', borderRadius: 2, '&:hover': { bgcolor: '#dce5ef' } }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      {/* ── Section 1: Contract Management ─────────────────────────────────── */}
      <Section title="Contract Management" delay={0.05}
        action={
          <Button size="small" variant="contained" startIcon={<SearchIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/contracts')}
            sx={{ fontSize: 11, fontWeight: 600, textTransform: 'none', py: 0.375, px: 1.5,
              bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
              boxShadow: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
            Browse Contracts
          </Button>
        }
      >
        <Box sx={{ display: 'flex', bgcolor: '#fff' }}>
          <StatCard label="Total Contracts" value={totalContracts}
            sub="Live UK government contracts" color="#2E75B6"
            icon={<AssignmentOutlinedIcon />} selected loading={isLoading} />
          <StatCard label="SME Win Rate" value={smeRate}
            sub="Contracts suitable for SMEs" color="#15803d"
            icon={<BusinessOutlinedIcon />} loading={isLoading} />
          <StatCard label="Avg Contract Value" value={avgValue}
            sub="Mean value across all active" color="#1d4ed8"
            icon={<AttachMoneyIcon />} loading={isLoading} />
          <StatCard label="Published This Week" value={growthRate}
            sub="New notices published" color="#7c3aed"
            icon={<TrendingUpIcon />} loading={isLoading} />
        </Box>

        {/* Action row */}
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e8edf3',
          display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" startIcon={<SearchIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/contracts')}
            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'none', borderColor: '#cbd5e1', color: '#374151',
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#fff' } }}>
            Search Contracts
          </Button>
          <Button size="small" variant="outlined" startIcon={<StarBorderIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/recommendations')}
            sx={{ fontSize: 12, fontWeight: 600, textTransform: 'none', borderColor: '#cbd5e1', color: '#374151',
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#fff' } }}>
            AI Recommendations
          </Button>
        </Box>
      </Section>

      {/* ── Section 2: Regional & Temporal Analysis ─────────────────────────── */}
      <Section title="Regional & Temporal Analysis" delay={0.15}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, bgcolor: '#fff' }}>
          <Box sx={{ p: 2.5, borderRight: { md: '1px solid #e8edf3' } }}>
            <SMEByRegionChart />
          </Box>
          <Box sx={{ p: 2.5 }}>
            <SMEOverTimeChart />
          </Box>
        </Box>
      </Section>

      {/* ── Section 3: Value & Sector Breakdown ─────────────────────────────── */}
      <Section title="Value & Sector Breakdown" delay={0.25}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, bgcolor: '#fff' }}>
          <Box sx={{ p: 2.5, borderRight: { md: '1px solid #e8edf3' } }}>
            <ValueBandChart data={charts?.value_bands} loading={isLoading} />
          </Box>
          <Box sx={{ p: 2.5 }}>
            <TopSectorsChart data={charts?.top_sectors} loading={isLoading} />
          </Box>
        </Box>
      </Section>

      {/* Footnote */}
      <Box sx={{ mt: 1, px: 0.5 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Data sourced from UK Contracts Finder, Find a Tender Service, Companies House & Spend Data — {(kpis?.total_fetched ?? 514875).toLocaleString()} contracts loaded.
        </Typography>
      </Box>
    </Box>
  )
}
