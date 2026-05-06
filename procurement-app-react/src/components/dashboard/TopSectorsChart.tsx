import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Box, Typography } from '@mui/material'
import { ChartSkeleton } from '../common/LoadingSpinner'

const FALLBACK = [
  { sector: 'IT Services',     sme_rate: 58.2 }, { sector: 'Construction',     sme_rate: 52.1 },
  { sector: 'R&D Services',    sme_rate: 71.4 }, { sector: 'Health Services',  sme_rate: 34.8 },
  { sector: 'Architecture',    sme_rate: 68.9 }, { sector: 'Education',        sme_rate: 61.3 },
  { sector: 'Business Svcs',   sme_rate: 47.5 }, { sector: 'Environmental',    sme_rate: 55.6 },
  { sector: 'Transport',       sme_rate: 38.2 }, { sector: 'Fin. Services',    sme_rate: 22.7 },
]

interface Props {
  data?: { sector: string; sme_rate: number }[]
  loading?: boolean
}

export function TopSectorsChart({ data, loading }: Props) {
  if (loading) return <ChartSkeleton height={280} />

  const chartData = (data?.length ? data : FALLBACK)
    .sort((a, b) => b.sme_rate - a.sme_rate)
    .slice(0, 10)

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: '#1F3A5F' }}>
        SME Rate by Sector (Top 10)
      </Typography>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 40, left: 20, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#6C757D' }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="sector" tick={{ fontSize: 10, fill: '#6C757D' }} width={80} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e8edf3' }} />
          <Bar dataKey="sme_rate" radius={[0, 4, 4, 0]} name="SME Rate">
            {chartData.map((entry) => (
              <Cell
                key={entry.sector}
                fill={entry.sme_rate >= 60 ? '#155724' : entry.sme_rate >= 40 ? '#2E75B6' : '#721C24'}
                opacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
