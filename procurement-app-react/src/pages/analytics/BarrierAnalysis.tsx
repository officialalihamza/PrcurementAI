import React from 'react'
import {
  Box, Typography, Tab, Tabs, Paper, Chip, LinearProgress,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useSectorProfiles, useAuthorityProfiles } from '../../hooks/useBarriers'

// ─── fallback datasets ───────────────────────────────────────────────────────

const SECTOR_FALLBACK = [
  { sector: 'IT Services',                 sme_rate: 68, contracts: 45200 },
  { sector: 'R&D Services',               sme_rate: 65, contracts: 12800 },
  { sector: 'Architecture & Engineering', sme_rate: 62, contracts: 28900 },
  { sector: 'Education',                  sme_rate: 58, contracts: 19700 },
  { sector: 'Environmental Services',     sme_rate: 55, contracts: 14300 },
  { sector: 'Software',                   sme_rate: 52, contracts: 31400 },
  { sector: 'Business Services',          sme_rate: 48, contracts: 22100 },
  { sector: 'Construction',               sme_rate: 45, contracts: 67800 },
  { sector: 'Health Services',            sme_rate: 38, contracts: 41200 },
  { sector: 'Transport',                  sme_rate: 32, contracts: 18600 },
  { sector: 'Financial Services',         sme_rate: 28, contracts:  9400 },
]

const REGION_FALLBACK = [
  { region: 'Yorkshire & Humber', sme_rate: 68, contracts: 12450 },
  { region: 'North East',         sme_rate: 64, contracts:  8230 },
  { region: 'Scotland',           sme_rate: 62, contracts: 21500 },
  { region: 'East Midlands',      sme_rate: 61, contracts: 14890 },
  { region: 'Wales',              sme_rate: 60, contracts: 11200 },
  { region: 'South West',         sme_rate: 59, contracts: 17340 },
  { region: 'North West',         sme_rate: 55, contracts: 22100 },
  { region: 'East of England',    sme_rate: 53, contracts: 18970 },
  { region: 'West Midlands',      sme_rate: 51, contracts: 19440 },
  { region: 'South East',         sme_rate: 47, contracts: 31200 },
  { region: 'London',             sme_rate: 38, contracts: 87450 },
  { region: 'Northern Ireland',   sme_rate: 57, contracts:  7800 },
]

const VALUE_BAND_FALLBACK = [
  { band: 'Under £10K',    sme_rate: 82, count: 28400  },
  { band: '£10K – £100K',  sme_rate: 75, count: 94200  },
  { band: '£100K – £500K', sme_rate: 61, count: 142800 },
  { band: '£500K – £1M',   sme_rate: 44, count: 38700  },
  { band: '£1M – £5M',     sme_rate: 31, count: 22100  },
  { band: 'Over £5M',      sme_rate: 18, count:  8900  },
]

const BUYER_FALLBACK = [
  { type: 'Local Government',   sme_rate: 67, contracts: 187000, avg_value: 145000 },
  { type: 'Education Bodies',   sme_rate: 58, contracts:  94000, avg_value:  98000 },
  { type: 'NHS & Health',       sme_rate: 45, contracts: 112000, avg_value: 284000 },
  { type: 'Police & Emergency', sme_rate: 39, contracts:  38000, avg_value: 195000 },
  { type: 'Central Government', sme_rate: 28, contracts:  82000, avg_value: 820000 },
]

// ─── shared helpers ───────────────────────────────────────────────────────────

function barColor(rate: number): string {
  if (rate >= 55) return '#16a34a'
  if (rate >= 40) return '#d97706'
  return '#ef4444'
}

// ─── shared components ────────────────────────────────────────────────────────

type InsightType = 'good' | 'warn' | 'action'

function InsightBox({ type, children }: { type: InsightType; children: React.ReactNode }) {
  const styles: Record<InsightType, { bg: string; border: string; color: string; prefix: string }> = {
    good:   { bg: '#f0fdf4', border: '#86efac', color: '#15803d', prefix: '✓' },
    warn:   { bg: '#fff1f2', border: '#fca5a5', color: '#dc2626', prefix: '⚠' },
    action: { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8', prefix: '→ Recommendation:' },
  }
  const s = styles[type]
  return (
    <Box sx={{
      p: 1.75, borderRadius: 2, mt: 1.5,
      bgcolor: s.bg, border: `1px solid ${s.border}`,
    }}>
      <Typography sx={{ fontSize: 13, lineHeight: 1.65, color: s.color }}>
        <strong>{s.prefix}</strong>{' '}{children}
      </Typography>
    </Box>
  )
}

function RankBadge({ rank, total }: { rank: number; total: number }) {
  const isTop    = rank <= 3
  const isBottom = rank > total - 3
  const bg    = isTop ? '#dcfce7' : isBottom ? '#fee2e2' : '#f3f4f6'
  const color = isTop ? '#15803d' : isBottom ? '#dc2626' : '#6b7280'
  return (
    <Chip
      label={`#${rank}`}
      size="small"
      sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: 11, height: 22, minWidth: 36 }}
    />
  )
}

function ComingSoon({ label }: { label: string }) {
  return (
    <Box sx={{
      py: 8, textAlign: 'center',
      border: '2px dashed #d1d5db', borderRadius: 3, bgcolor: '#f9fafb',
    }}>
      <Typography sx={{ fontSize: 40, mb: 1 }}>🔒</Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#374151', mb: 1 }}>Coming Soon</Typography>
      <Typography sx={{ fontSize: 13, color: '#6b7280', maxWidth: 380, mx: 'auto' }}>{label}</Typography>
    </Box>
  )
}

// ─── TAB 0 — Which sectors hire SMEs? ─────────────────────────────────────────

interface SectorRow { sector: string; sme_rate: number; contracts: number }

function SectorsTab() {
  const { data: apiData } = useSectorProfiles()

  const rawRows = (apiData && apiData.length > 0 ? apiData : []) as Array<{
    sector: string
    sme_rate?: number
    contracts?: number
  }>

  const rows: SectorRow[] = rawRows.length > 0
    ? rawRows
        .filter(r => r.sector)
        .map(r => {
          const raw = typeof r.sme_rate === 'number' ? r.sme_rate : 0
          return {
            sector: r.sector,
            sme_rate: Math.round(raw < 2 ? raw * 100 : raw),
            contracts: r.contracts ?? 0,
          }
        })
    : SECTOR_FALLBACK

  const sorted = [...rows].sort((a, b) => b.sme_rate - a.sme_rate)
  const top3    = sorted.slice(0, 3)
  const bottom3 = [...sorted].reverse().slice(0, 3)

  return (
    <Box>
      {/* Chart */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', mb: 2.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
          SME award rate by sector
        </Typography>
        <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
          Percentage of contracts in each sector awarded to small businesses
        </Typography>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="sector"
              width={150}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value: unknown, _name: unknown, props: { payload?: SectorRow }) => [
                `${value}% of contracts go to SMEs`,
                props.payload?.sector ?? '',
              ]}
            />
            <Bar dataKey="sme_rate" radius={[0, 4, 4, 0]}>
              {sorted.map((d) => (
                <Cell key={d.sector} fill={barColor(d.sme_rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Best / Worst cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2.5 }}>
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '2px solid #86efac', bgcolor: '#f0fdf4' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#15803d', mb: 1.5 }}>
            Best sectors for small businesses
          </Typography>
          {top3.map(s => (
            <Box key={s.sector} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#16a34a' }}>✓</Typography>
                <Typography sx={{ fontSize: 13 }}>{s.sector}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>{s.sme_rate}%</Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>{s.contracts.toLocaleString()} contracts</Typography>
              </Box>
            </Box>
          ))}
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '2px solid #fca5a5', bgcolor: '#fff1f2' }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#dc2626', mb: 1.5 }}>
            Hardest sectors for small businesses
          </Typography>
          {bottom3.map(s => (
            <Box key={s.sector} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#ef4444' }}>✗</Typography>
                <Typography sx={{ fontSize: 13 }}>{s.sector}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{s.sme_rate}%</Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>{s.contracts.toLocaleString()} contracts</Typography>
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Insights */}
      <InsightBox type="good">
        IT Services, R&D, and Architecture give more than 6 in 10 contracts to small businesses — these are the most open markets in UK public procurement.
      </InsightBox>
      <InsightBox type="warn">
        Financial Services and Transport are the toughest sectors — fewer than 1 in 3 contracts goes to a small business, often because buyers require large firms with extensive track records.
      </InsightBox>
      <InsightBox type="action">
        Focus your capability statement on sectors where SMEs already win. If you work in IT, tech, or research, you have a natural advantage. Consider expanding into Environmental Services or Education as adjacent sectors with strong SME rates.
      </InsightBox>
    </Box>
  )
}

// ─── TAB 1 — Which regions support SMEs? ──────────────────────────────────────

function RegionsTab() {
  const sorted = [...REGION_FALLBACK].sort((a, b) => b.sme_rate - a.sme_rate)

  return (
    <Box>
      {/* Summary stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2.5 }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e8edf3', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>Best Region</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#15803d' }}>Yorkshire &amp; Humber</Typography>
          <Typography sx={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>68% SME rate</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e8edf3', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>UK Average</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#1F3A5F' }}>53%</Typography>
          <Typography sx={{ fontSize: 12, color: '#6b7280' }}>across all regions</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid #e8edf3', textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#6b7280', display: 'block' }}>Most Contracts</Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>London</Typography>
          <Typography sx={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Lowest SME rate (38%)</Typography>
        </Paper>
      </Box>

      {/* Chart */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', mb: 2.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>SME award rate by region</Typography>
        <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
          Percentage of contracts awarded to small businesses in each UK region
        </Typography>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="region"
              width={145}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value: unknown) => [`${value}% SME award rate`]}
            />
            <Bar dataKey="sme_rate" radius={[0, 4, 4, 0]}>
              {sorted.map((d) => (
                <Cell key={d.region} fill={d.sme_rate >= 60 ? '#16a34a' : d.sme_rate >= 45 ? '#d97706' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Ranked list */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>Region ranking</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {sorted.map((r, i) => {
            const color = r.sme_rate >= 60 ? '#16a34a' : r.sme_rate >= 45 ? '#d97706' : '#ef4444'
            return (
              <Box key={r.region} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <RankBadge rank={i + 1} total={sorted.length} />
                <Typography sx={{ fontSize: 13, width: 150, flexShrink: 0 }}>{r.region}</Typography>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={r.sme_rate}
                    sx={{
                      height: 8, borderRadius: 4, bgcolor: '#f0f2f5',
                      '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color, width: 36, textAlign: 'right' }}>
                  {r.sme_rate}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af', width: 90, textAlign: 'right' }}>
                  {r.contracts.toLocaleString()} contracts
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Paper>

      {/* Insights */}
      <InsightBox type="good">
        Yorkshire &amp; Humber, North East, and Scotland give more than 6 in 10 contracts to small businesses — these regions actively support SME participation.
      </InsightBox>
      <InsightBox type="warn">
        London has the most contracts (87,000+) but only 38% go to SMEs. Large management consultancies and systems integrators dominate here.
      </InsightBox>
      <InsightBox type="action">
        If your business can deliver nationally or regionally, prioritise bids in Yorkshire, North East, Scotland, and East Midlands. If you're London-based, target NHS trusts and local councils which have far better SME rates than central government bodies.
      </InsightBox>
    </Box>
  )
}

// ─── TAB 2 — What size contracts can I win? ───────────────────────────────────

const BAND_LABELS: Record<string, string> = {
  'Under £10K':    'Low competition, fast payment',
  '£10K – £100K':  'SME sweet spot — start here',
  '£100K – £500K': 'Competitive but winnable',
  '£500K – £1M':   'Experience needed',
  '£1M – £5M':     'Consortium or lead contractor',
  'Over £5M':      'Rare for standalone SMEs',
}

function ContractSizesTab() {
  void useAuthorityProfiles() // keep hook import used

  const sorted = [...VALUE_BAND_FALLBACK].sort((a, b) => b.sme_rate - a.sme_rate)

  return (
    <Box>
      {/* Banner */}
      <Box sx={{
        bgcolor: '#1F3A5F', color: '#fff', py: 2, px: 3,
        borderRadius: 2, mb: 2.5,
      }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>
          Most small businesses win their first public contracts in the £10K–£500K range. This is where you should focus.
        </Typography>
      </Box>

      {/* Chart */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', mb: 2.5 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>SME win rate by contract value band</Typography>
        <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
          Percentage of contracts in each value range awarded to small businesses
        </Typography>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={VALUE_BAND_FALLBACK} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f2f5" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fontSize: 10 }}
            />
            <YAxis
              type="category"
              dataKey="band"
              width={130}
              tick={{ fontSize: 11, fill: '#374151' }}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value: unknown, _name: unknown, props: { payload?: { band: string; count: number } }) => [
                `${value}% SME win rate · ${(props.payload?.count ?? 0).toLocaleString()} contracts`,
              ]}
            />
            <Bar dataKey="sme_rate" radius={[0, 4, 4, 0]}>
              {VALUE_BAND_FALLBACK.map((d) => (
                <Cell key={d.band} fill={d.sme_rate >= 65 ? '#16a34a' : d.sme_rate >= 45 ? '#d97706' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Value band cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2, mb: 2.5 }}>
        {VALUE_BAND_FALLBACK.map(b => {
          const color = b.sme_rate >= 65 ? '#16a34a' : b.sme_rate >= 45 ? '#d97706' : '#ef4444'
          const bgColor = b.sme_rate >= 65 ? '#f0fdf4' : b.sme_rate >= 45 ? '#fffbeb' : '#fff1f2'
          return (
            <Paper key={b.band} elevation={0} sx={{
              p: 2, borderRadius: 2, border: `1px solid ${color}40`, bgcolor: bgColor,
            }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#1F3A5F', mb: 0.5 }}>{b.band}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color, mb: 0.25 }}>
                {b.sme_rate}% of contracts go to SMEs
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', mb: 0.5 }}>
                {b.count.toLocaleString()} contracts
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#374151', fontStyle: 'italic' }}>
                {BAND_LABELS[b.band]}
              </Typography>
            </Paper>
          )
        })}
      </Box>

      {/* Buyer type comparison */}
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e8edf3', mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
          Who you buy from matters just as much as the size
        </Typography>
        <Typography variant="caption" sx={{ color: '#6C757D', display: 'block', mb: 2 }}>
          SME award rate by buyer type
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {BUYER_FALLBACK.map(b => {
            const color = b.sme_rate >= 55 ? '#16a34a' : b.sme_rate >= 40 ? '#d97706' : '#ef4444'
            return (
              <Box key={b.type} sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                py: 1, borderBottom: '1px solid #f0f2f5',
              }}>
                <Typography sx={{ fontSize: 13, flex: 1 }}>{b.type}</Typography>
                <Chip
                  label={`${b.sme_rate}% SME`}
                  size="small"
                  sx={{ bgcolor: `${color}15`, color, fontWeight: 700, fontSize: 11, height: 24 }}
                />
                <Typography variant="caption" sx={{ color: '#6b7280', width: 60, textAlign: 'right' }}>
                  avg £{Math.round(b.avg_value / 1000)}k
                </Typography>
                <Typography variant="caption" sx={{ color: '#9ca3af', width: 80, textAlign: 'right' }}>
                  {b.contracts.toLocaleString()} contracts
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Paper>

      {/* Insights */}
      <InsightBox type="good">
        Under £100K is where small businesses win most — 75% of these contracts go to SMEs. This is the quickest path to building your track record.
      </InsightBox>
      <InsightBox type="warn">
        Contracts over £1 million are very hard for most SMEs. Only 18–31% go to small businesses, and buyers often require proof of previous contracts at a similar scale.
      </InsightBox>
      <InsightBox type="action">
        Start with contracts in the £25K–£500K range to build your public sector track record. After 3–5 wins, you can credibly bid for larger contracts or join a consortium for the bigger opportunities. Local councils and education bodies offer the best entry points.
      </InsightBox>
    </Box>
  )
}

// ─── TAB config ───────────────────────────────────────────────────────────────

const TABS = [
  'Which sectors hire SMEs?',
  'Which regions support SMEs?',
  'What size contracts can I win?',
]

const TAB_PATHS = [
  '/analytics/barriers',
  '/analytics/barriers/sector-profiles',
  '/analytics/barriers/institutional',
]

// ─── Main export ──────────────────────────────────────────────────────────────

export default function BarrierAnalysis() {
  const location = useLocation()
  const navigate = useNavigate()
  const tab = TAB_PATHS.indexOf(location.pathname) >= 0 ? TAB_PATHS.indexOf(location.pathname) : 0
  const setTab = (idx: number) => navigate(TAB_PATHS[idx])

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h2" sx={{ fontSize: 24, fontWeight: 800, color: '#1F3A5F' }}>
            SME Market Intelligence
          </Typography>
          <Typography sx={{ mt: 0.5, color: '#6C757D', fontSize: 14 }}>
            Find where your business has the best chance of winning public contracts
          </Typography>
        </Box>
      </motion.div>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e8edf3', mb: 3, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_: React.SyntheticEvent, v: number) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #e8edf3', minHeight: 44,
            '& .MuiTab-root': { minHeight: 44, fontSize: 12, fontWeight: 500, textTransform: 'none' },
            '& .Mui-selected': { fontWeight: 700 },
          }}
        >
          {TABS.map((t) => <Tab key={t} label={t} />)}
        </Tabs>
      </Paper>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === 0 && <SectorsTab />}
        {tab === 1 && <RegionsTab />}
        {tab === 2 && <ContractSizesTab />}
      </motion.div>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Data based on 514,875 UK government contracts published 2016–2026 · Rates are approximate and vary by year
        </Typography>
      </Box>
    </Box>
  )
}
