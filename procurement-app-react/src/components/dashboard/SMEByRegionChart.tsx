import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Box, Typography } from '@mui/material'
import { ChartSkeleton } from '../common/LoadingSpinner'

const FALLBACK = [
  { region: 'London', sme_rate: 38.2 },
  { region: 'South East', sme_rate: 45.1 },
  { region: 'North West', sme_rate: 52.3 },
  { region: 'Yorkshire', sme_rate: 55.8 },
  { region: 'West Mids', sme_rate: 48.6 },
  { region: 'East Eng', sme_rate: 51.2 },
  { region: 'Scotland', sme_rate: 62.4 },
  { region: 'Wales', sme_rate: 58.1 },
]

interface Props {
  data?: { region: string; sme_rate: number }[]
  loading?: boolean
}

export function SMEByRegionChart({ data, loading }: Props) {
  if (loading) return <ChartSkeleton height={260} />

  const chartData = data?.length ? data : FALLBACK

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: '#1F3A5F' }}>
        SME Award Rate by Region
      </Typography>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
          <XAxis dataKey="region" tick={{ fontSize: 10, fill: '#6C757D' }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 10, fill: '#6C757D' }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8edf3' }}
          />
          <Bar dataKey="sme_rate" radius={[4, 4, 0, 0]} name="SME Rate">
            {chartData.map((entry) => (
              <Cell
                key={entry.region}
                fill={entry.sme_rate >= 55 ? '#155724' : entry.sme_rate >= 40 ? '#2E75B6' : '#721C24'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
