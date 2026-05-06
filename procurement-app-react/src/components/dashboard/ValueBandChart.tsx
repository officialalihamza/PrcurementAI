import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Box, Typography } from '@mui/material'
import { ChartSkeleton } from '../common/LoadingSpinner'

const FALLBACK = [
  { band: '<£25k',     total: 12840, sme: 11200 },
  { band: '£25k–£213k', total: 28560, sme: 19100 },
  { band: '£213k–£1M', total: 14320, sme: 7800 },
  { band: '£1M–£5M',   total: 6240,  sme: 2100 },
  { band: '>£5M',      total: 2180,  sme: 320 },
]

interface Props {
  data?: { band: string; count: number; sme_count: number }[]
  loading?: boolean
}

export function ValueBandChart({ data, loading }: Props) {
  if (loading) return <ChartSkeleton height={260} />

  const chartData = data?.length
    ? data.map(d => ({ band: d.band, total: d.count, sme: d.sme_count }))
    : FALLBACK

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: '#1F3A5F' }}>
        Contracts by Value Band
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
          <XAxis dataKey="band" tick={{ fontSize: 10, fill: '#6C757D' }} />
          <YAxis tick={{ fontSize: 10, fill: '#6C757D' }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8edf3' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="total" name="All Contracts" fill="#9eb0ca" radius={[3, 3, 0, 0]} />
          <Bar dataKey="sme" name="SME Contracts" fill="#155724" opacity={0.8} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
