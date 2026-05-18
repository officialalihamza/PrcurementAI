import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { Box, Typography } from '@mui/material'
import { ChartSkeleton } from '../common/LoadingSpinner'
import { useRegionalSME } from '../../hooks/useAnalytics'

const FALLBACK: { region: string; sme_rate: number; contract_count: number }[] = [
  { region: 'Scotland',              sme_rate: 50.3, contract_count: 9176  },
  { region: 'Northern Ireland',      sme_rate: 49.8, contract_count: 1988  },
  { region: 'South West',            sme_rate: 49.7, contract_count: 53536 },
  { region: 'South East',            sme_rate: 49.1, contract_count: 28152 },
  { region: 'West Midlands',         sme_rate: 48.7, contract_count: 48743 },
  { region: 'Wales',                 sme_rate: 44.2, contract_count: 7471  },
  { region: 'North West',            sme_rate: 43.7, contract_count: 31496 },
  { region: 'North East',            sme_rate: 39.9, contract_count: 19502 },
  { region: 'East Midlands',         sme_rate: 37.7, contract_count: 24388 },
  { region: 'East of England',       sme_rate: 34.2, contract_count: 14617 },
  { region: 'London',                sme_rate: 34.2, contract_count: 83041 },
  { region: 'Yorkshire & The Humber',sme_rate: 32.0, contract_count: 39096 },
]

function barColor(rate: number): string {
  if (rate >= 70) return '#155724'
  if (rate >= 50) return '#856404'
  return '#721C24'
}

interface Row { region: string; sme_rate: number; contract_count: number }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e8edf3', borderRadius: 2,
      px: 1.5, py: 1, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1F3A5F', mb: 0.25 }}>{d.region}</Typography>
      <Typography sx={{ fontSize: 12, color: barColor(d.sme_rate) }}>
        <strong>{d.sme_rate}%</strong> of contracts go to SMEs
      </Typography>
      <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
        {d.contract_count.toLocaleString()} contracts analysed
      </Typography>
    </Box>
  )
}

export function SMEByRegionChart() {
  const { data, isLoading } = useRegionalSME()

  if (isLoading) return <ChartSkeleton height={300} />

  const rows   = data && data.length > 0 ? data : FALLBACK
  const sorted = [...rows].sort((a, b) => b.sme_rate - a.sme_rate)

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: 14, fontWeight: 600, mb: 0.5, color: '#1F3A5F' }}>
        SME Award Rate by Region
      </Typography>
      <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
        % of contracts awarded to SMEs per UK region · sorted highest first
      </Typography>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 10, fill: '#6C757D' }}
          />
          <YAxis
            type="category"
            dataKey="region"
            width={148}
            tick={{ fontSize: 11, fill: '#374151' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="sme_rate" radius={[0, 4, 4, 0]} name="SME Rate">
            <LabelList
              dataKey="sme_rate"
              position="right"
              formatter={(v: unknown) => `${v}%`}
              style={{ fontSize: 11, fontWeight: 600, fill: '#374151' }}
            />
            {sorted.map((entry) => (
              <Cell key={entry.region} fill={barColor(entry.sme_rate)} opacity={0.88} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
        {[
          { label: '≥ 70%  High SME access', color: '#155724' },
          { label: '50–70%  Moderate',        color: '#856404' },
          { label: '< 50%  Low SME access',   color: '#721C24' },
        ].map(({ label, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: color, opacity: 0.88 }} />
            <Typography sx={{ fontSize: 10, color: '#6C757D' }}>{label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
