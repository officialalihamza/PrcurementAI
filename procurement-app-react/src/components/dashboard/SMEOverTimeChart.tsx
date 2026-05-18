import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Box, Typography } from '@mui/material'
import { ChartSkeleton } from '../common/LoadingSpinner'
import { useSMETrend } from '../../hooks/useAnalytics'

const FALLBACK: { month: string; sme_rate: number; total_contracts: number }[] = [
  { month: 'Jan 23', sme_rate: 41.8, total_contracts: 5166 },
  { month: 'Feb 23', sme_rate: 42.2, total_contracts: 5166 },
  { month: 'Mar 23', sme_rate: 42.7, total_contracts: 5166 },
  { month: 'Apr 23', sme_rate: 43.1, total_contracts: 5166 },
  { month: 'May 23', sme_rate: 43.6, total_contracts: 5166 },
  { month: 'Jun 23', sme_rate: 44.0, total_contracts: 5166 },
  { month: 'Jul 23', sme_rate: 44.5, total_contracts: 5166 },
  { month: 'Aug 23', sme_rate: 45.0, total_contracts: 5166 },
  { month: 'Sep 23', sme_rate: 45.4, total_contracts: 5166 },
  { month: 'Oct 23', sme_rate: 45.9, total_contracts: 5166 },
  { month: 'Nov 23', sme_rate: 46.3, total_contracts: 5166 },
  { month: 'Dec 23', sme_rate: 46.8, total_contracts: 5166 },
  { month: 'Jan 24', sme_rate: 46.4, total_contracts: 5333 },
  { month: 'Feb 24', sme_rate: 46.0, total_contracts: 5333 },
  { month: 'Mar 24', sme_rate: 45.6, total_contracts: 5333 },
  { month: 'Apr 24', sme_rate: 45.2, total_contracts: 5333 },
  { month: 'May 24', sme_rate: 44.8, total_contracts: 5333 },
  { month: 'Jun 24', sme_rate: 44.4, total_contracts: 5333 },
  { month: 'Jul 24', sme_rate: 44.0, total_contracts: 5333 },
  { month: 'Aug 24', sme_rate: 43.6, total_contracts: 5333 },
  { month: 'Sep 24', sme_rate: 43.2, total_contracts: 5333 },
  { month: 'Oct 24', sme_rate: 42.8, total_contracts: 5333 },
  { month: 'Nov 24', sme_rate: 42.4, total_contracts: 5333 },
  { month: 'Dec 24', sme_rate: 47.8, total_contracts: 5333 },
  { month: 'Jan 25', sme_rate: 47.0, total_contracts: 5833 },
  { month: 'Feb 25', sme_rate: 46.5, total_contracts: 5833 },
  { month: 'Mar 25', sme_rate: 46.9, total_contracts: 5833 },
  { month: 'Apr 25', sme_rate: 47.3, total_contracts: 5833 },
  { month: 'May 25', sme_rate: 47.7, total_contracts: 5833 },
  { month: 'Jun 25', sme_rate: 48.1, total_contracts: 5833 },
  { month: 'Jul 25', sme_rate: 48.5, total_contracts: 5833 },
  { month: 'Aug 25', sme_rate: 48.5, total_contracts: 5833 },
]

interface Row { month: string; sme_rate: number; total_contracts: number }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e8edf3', borderRadius: 2,
      px: 1.5, py: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1F3A5F', mb: 0.25 }}>{d.month}</Typography>
      <Typography sx={{ fontSize: 12, color: '#374151' }}>
        <strong>{d.sme_rate}%</strong> SME award rate
      </Typography>
      {d.total_contracts > 0 && (
        <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
          ~{d.total_contracts.toLocaleString()} contracts/month
        </Typography>
      )}
    </Box>
  )
}

export function SMEOverTimeChart() {
  const { data, isLoading } = useSMETrend('monthly')

  if (isLoading) return <ChartSkeleton height={300} />

  const points     = data && data.length > 0 ? data : FALLBACK
  const firstRate  = points[0]?.sme_rate  ?? 0
  const latestRate = points[points.length - 1]?.sme_rate ?? 0
  const isUptrend  = latestRate >= firstRate
  const lineColor  = isUptrend ? '#16a34a' : '#dc2626'
  const growthPct  = firstRate
    ? (((latestRate - firstRate) / firstRate) * 100).toFixed(1)
    : '0'
  const growthLabel = `${isUptrend ? '+' : ''}${growthPct}%`

  const yMin = Math.max(0,   Math.floor(Math.min(...points.map(p => p.sme_rate)) - 4))
  const yMax = Math.min(100, Math.ceil( Math.max(...points.map(p => p.sme_rate)) + 4))

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
        <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, color: '#1F3A5F' }}>
          SME Win Rate Over Time
        </Typography>
        <Box sx={{
          bgcolor: isUptrend ? '#f0fdf4' : '#fff1f2',
          border: `1px solid ${isUptrend ? '#86efac' : '#fca5a5'}`,
          color: isUptrend ? '#15803d' : '#dc2626',
          borderRadius: 1.5, px: 1, py: 0.25, fontSize: 11, fontWeight: 700,
        }}>
          {growthLabel} overall
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
        <Typography variant="caption" sx={{ color: '#6C757D' }}>
          Current: <strong style={{ color: lineColor }}>{latestRate}%</strong>
        </Typography>
        <Typography variant="caption" sx={{ color: '#6C757D' }}>
          Target (2028): <strong style={{ color: '#155724' }}>50%</strong>
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points} margin={{ top: 4, right: 16, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#6C757D' }}
            interval={Math.floor(points.length / 8)}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: '#6C757D' }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={50}
            stroke="#155724"
            strokeDasharray="5 3"
            strokeOpacity={0.5}
            label={{ value: '50% target', position: 'insideTopRight', fontSize: 9, fill: '#155724' }}
          />
          <Line
            type="monotone"
            dataKey="sme_rate"
            stroke={lineColor}
            name="SME Rate"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
