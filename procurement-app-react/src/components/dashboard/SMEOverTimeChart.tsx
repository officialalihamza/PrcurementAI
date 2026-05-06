import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Box, Typography } from '@mui/material'
import { ChartSkeleton } from '../common/LoadingSpinner'

const FALLBACK = [
  { month: 'Jan 24', sme_rate: 39.2 }, { month: 'Feb 24', sme_rate: 40.1 },
  { month: 'Mar 24', sme_rate: 41.8 }, { month: 'Apr 24', sme_rate: 40.5 },
  { month: 'May 24', sme_rate: 42.3 }, { month: 'Jun 24', sme_rate: 43.1 },
  { month: 'Jul 24', sme_rate: 41.9 }, { month: 'Aug 24', sme_rate: 44.2 },
  { month: 'Sep 24', sme_rate: 42.7 }, { month: 'Oct 24', sme_rate: 43.8 },
  { month: 'Nov 24', sme_rate: 44.5 }, { month: 'Dec 24', sme_rate: 45.1 },
]

interface Props {
  data?: { month: string; sme_rate: number }[]
  loading?: boolean
}

export function SMEOverTimeChart({ data, loading }: Props) {
  if (loading) return <ChartSkeleton height={260} />

  const chartData = data?.length ? data : FALLBACK

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: '#1F3A5F' }}>
        SME Win Rate Over Time
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6C757D' }} />
          <YAxis tick={{ fontSize: 10, fill: '#6C757D' }} domain={[30, 60]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8edf3' }} />
          <ReferenceLine y={50} stroke="#155724" strokeDasharray="4 2" strokeOpacity={0.4} />
          <Line
            type="monotone" dataKey="sme_rate" stroke="#2E75B6" name="SME Rate"
            strokeWidth={2.5} dot={{ r: 3, fill: '#2E75B6' }} activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
