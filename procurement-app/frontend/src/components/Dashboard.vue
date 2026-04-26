<template>
  <div class="space-y-6">

    <!-- API error banner -->
    <div v-if="apiError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-mono">
      {{ apiError }}
    </div>

    <!-- ── KPI Row ── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
      <div
        class="card p-4 cursor-pointer hover:shadow-md hover:border-brand-200 transition-shadow"
        @click="goToRecentContracts"
      >
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Last 3 Months</p>
        <p class="mt-1 text-2xl font-bold text-brand-600 underline decoration-dotted">{{ kpis.week_count ?? '—' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">New opportunities</p>
      </div>

      <div class="card p-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spend</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ kpis.total_spend != null ? '£' + (kpis.total_spend / 1e6).toFixed(1) + 'M' : '—' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">Live contract value</p>
      </div>

      <div class="card p-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Value</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ kpis.avg_value != null ? '£' + Math.round(kpis.avg_value).toLocaleString('en-GB') : '—' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">Mean award value</p>
      </div>

      <div class="card p-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">SME Suitable</p>
        <p class="mt-1 text-2xl font-bold text-emerald-600">{{ kpis.sme_count != null ? kpis.sme_count : '—' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">Of {{ kpis.total_fetched ?? '—' }} fetched</p>
      </div>

      <div class="card p-4">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Unique Buyers</p>
        <p class="mt-1 text-2xl font-bold text-indigo-600">{{ kpis.unique_buyers ?? '—' }}</p>
        <p class="mt-0.5 text-xs text-gray-400">Active authorities</p>
      </div>

      <div
        class="card p-4"
        :class="urgencyClass"
      >
        <p class="text-xs font-medium uppercase tracking-wide" :class="urgencyTextClass">Deadlines Soon</p>
        <p class="mt-1 text-2xl font-bold" :class="urgencyValueClass">{{ (kpis.expiring_week ?? 0) + (kpis.expiring_month ?? 0) }}</p>
        <p class="mt-0.5 text-xs" :class="urgencySubClass">
          {{ kpis.expiring_week ?? 0 }} this week · {{ kpis.expiring_month ?? 0 }} this month
        </p>
      </div>
    </div>

    <!-- ── Charts Row 1 ── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- SME Rate by Region (wider) -->
      <div class="card p-5 lg:col-span-2">
        <h3 class="font-semibold text-gray-900 mb-4">SME Rate by Buyer Location</h3>
        <div v-if="chartData.sme_by_region.length" class="h-72">
          <Bar :data="smeByRegionData" :options="horizontalBarOpts" />
        </div>
        <div v-else class="h-72 flex items-center justify-center text-gray-400 text-sm">
          <div class="text-center">
            <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            No region data
          </div>
        </div>
      </div>

      <!-- SME vs Large Doughnut -->
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">Contract Type Split</h3>
        <div v-if="hasSmeData" class="h-72 flex flex-col items-center justify-center gap-4">
          <div class="w-48 h-48">
            <Doughnut :data="smeDonutData" :options="donutOpts" />
          </div>
          <div class="flex flex-wrap gap-3 justify-center text-xs">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>SME ({{ kpis.sme_count }})</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>Large ({{ kpis.large_count }})</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>Unknown ({{ kpis.unknown_count }})</span>
          </div>
        </div>
        <div v-else class="h-72 flex flex-col items-center justify-center text-gray-400 text-sm text-center gap-3 px-4">
          <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
          <p>SME suitability not specified in this batch of live contracts.</p>
          <p class="text-xs text-gray-300">UK dissertation data shows ~64% SME rate nationally.</p>
        </div>
      </div>
    </div>

    <!-- ── Charts Row 2 ── -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Contract Value Bands -->
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">Contract Value Distribution</h3>
        <div v-if="chartData.value_bands.some(b => b.count > 0)" class="h-64">
          <Bar :data="valueBandsData" :options="barOpts" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-400 text-sm">No data</div>
      </div>

      <!-- SME Rate Trend — dissertation data -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900">UK SME Rate Trend 2016–2030</h3>
          <span class="text-xs px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full border border-brand-100">Dissertation analysis</span>
        </div>
        <div class="h-64">
          <Line :data="smeHistoricalData" :options="lineOpts" />
        </div>
        <p class="text-xs text-gray-400 mt-2">ARIMA(0,1,1) forecast · 514,875 contracts · R²=0.852</p>
      </div>
    </div>

    <!-- ── Top Sectors (if data) ── -->
    <div v-if="chartData.top_sectors.length" class="card p-5">
      <h3 class="font-semibold text-gray-900 mb-4">Top Sectors (Live Data)</h3>
      <div class="h-48">
        <Bar :data="topSectorsData" :options="horizontalBarOpts" />
      </div>
    </div>

    <!-- ── Recent Contracts ── -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="font-semibold text-gray-900">Recently Published Contracts</h3>
        <RouterLink to="/contracts" class="text-sm text-brand-600 hover:text-brand-800 font-medium">View all →</RouterLink>
      </div>
      <div v-if="recentContracts.length">
        <table class="w-full text-sm">
          <tbody>
            <tr
              v-for="c in recentContracts" :key="c.ocid"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="px-5 py-3 max-w-xs">
                <a v-if="c.url" :href="c.url" target="_blank" rel="noopener"
                  class="font-medium text-gray-900 hover:text-brand-700 line-clamp-1 block">
                  {{ c.title || c.ocid }}
                </a>
                <p v-else class="font-medium text-gray-900 line-clamp-1">{{ c.title || c.ocid }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ c.buyer }}</p>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-right font-medium text-gray-800">
                {{ c.value ? '£' + Math.round(c.value).toLocaleString('en-GB') : 'TBC' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-gray-500 text-xs hidden sm:table-cell">
                {{ c.published ? new Date(c.published).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '' }}
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-xs hidden md:table-cell">
                <span v-if="c.deadline" :class="deadlineClass(c.deadline)">
                  Closes {{ new Date(c.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) }}
                </span>
                <span v-else class="text-gray-400">Open</span>
              </td>
              <td class="px-4 py-3 text-xs">
                <span v-if="c.sme_suitable === true" class="badge-sme">SME</span>
                <span v-else-if="c.sme_suitable === false" class="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">Large</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="px-5 py-8 text-center text-gray-400 text-sm">
        <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        No recent contracts loaded yet
      </div>
    </div>

    <!-- ── Dissertation Key Insights ── -->
    <div>
      <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span class="w-1 h-5 bg-brand-500 rounded-full inline-block"></span>
        UK Procurement Intelligence
        <span class="text-xs font-normal text-gray-400 ml-1">· 514,875 contracts · 2016–2026</span>
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="insight in insights" :key="insight.title"
          class="card p-4 border-l-4"
          :class="insight.border"
        >
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-lg" :class="insight.bg">
              {{ insight.icon }}
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wide mb-1" :class="insight.label">{{ insight.title }}</p>
              <p class="text-xl font-bold text-gray-900">{{ insight.value }}</p>
              <p class="text-xs text-gray-500 mt-0.5 leading-snug">{{ insight.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Authority Cluster Summary ── -->
    <div class="card p-5">
      <h3 class="font-semibold text-gray-900 mb-1">UK Authority SME-Friendliness Clusters</h3>
      <p class="text-xs text-gray-500 mb-4">K-Means clustering of 3,412 authorities · Silhouette score 0.316</p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="cluster in clusters" :key="cluster.name"
          class="rounded-xl p-4 border"
          :class="cluster.bg"
        >
          <p class="text-xs font-semibold uppercase tracking-wide mb-1" :class="cluster.label">{{ cluster.name }}</p>
          <p class="text-3xl font-bold" :class="cluster.value">{{ cluster.rate }}</p>
          <p class="text-xs mt-1" :class="cluster.sub">SME award rate</p>
          <p class="text-xs font-medium mt-2 text-gray-600">{{ cluster.count }} authorities</p>
        </div>
      </div>
    </div>

    <p class="text-xs text-gray-400 text-right">
      Live data: last updated {{ lastUpdated }} · auto-refreshes every 30 min
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bar, Line, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { dashboardApi } from '@/lib/api'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement,
  Title, Tooltip, Legend, Filler,
)

const router = useRouter()
const stats = ref(null)
const loading = ref(false)
const apiError = ref('')
let interval = null

function goToRecentContracts() {
  const to   = new Date().toISOString().split('T')[0]
  const from = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]
  router.push({ name: 'Contracts', query: { date_from: from, date_to: to } })
}

const lastUpdated = computed(() =>
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
)

const kpis = computed(() => stats.value?.kpis || {})
const chartData = computed(() => ({
  sme_by_region: stats.value?.charts?.sme_by_region || [],
  value_bands:   stats.value?.charts?.value_bands   || [],
  top_sectors:   stats.value?.charts?.top_sectors   || [],
}))
const recentContracts = computed(() => stats.value?.recent_contracts || [])
const hasSmeData = computed(() => (kpis.value.sme_count ?? 0) + (kpis.value.large_count ?? 0) > 0)

// Deadline urgency card styling
const urgencyTotal = computed(() => (kpis.value.expiring_week ?? 0) + (kpis.value.expiring_month ?? 0))
const urgencyClass     = computed(() => urgencyTotal.value > 5  ? 'border-red-200 bg-red-50'   : urgencyTotal.value > 0 ? 'border-amber-200 bg-amber-50'   : 'card')
const urgencyTextClass = computed(() => urgencyTotal.value > 5  ? 'text-red-500'  : urgencyTotal.value > 0 ? 'text-amber-600'  : 'text-gray-500')
const urgencyValueClass= computed(() => urgencyTotal.value > 5  ? 'text-red-700'  : urgencyTotal.value > 0 ? 'text-amber-700'  : 'text-gray-900')
const urgencySubClass  = computed(() => urgencyTotal.value > 5  ? 'text-red-400'  : urgencyTotal.value > 0 ? 'text-amber-500'  : 'text-gray-400')

function deadlineClass(date) {
  const days = (new Date(date) - Date.now()) / 86400000
  if (days < 7)  return 'text-red-600 font-medium'
  if (days < 30) return 'text-amber-600 font-medium'
  return 'text-gray-500'
}

// ── Chart data ──────────────────────────────────────────────────────────────

const smeByRegionData = computed(() => ({
  labels: chartData.value.sme_by_region.map(d => d.region),
  datasets: [{
    label: 'SME Rate (%)',
    data: chartData.value.sme_by_region.map(d => d.sme_rate),
    backgroundColor: '#2563eb99',
    borderColor: '#2563eb',
    borderWidth: 1,
    borderRadius: 3,
  }],
}))

const smeDonutData = computed(() => ({
  labels: ['SME Suitable', 'Large Only', 'Not Specified'],
  datasets: [{
    data: [kpis.value.sme_count ?? 0, kpis.value.large_count ?? 0, kpis.value.unknown_count ?? 0],
    backgroundColor: ['#10b981cc', '#6366f1cc', '#d1d5dbcc'],
    borderColor:     ['#10b981',   '#6366f1',   '#d1d5db'],
    borderWidth: 1,
  }],
}))

const valueBandsData = computed(() => ({
  labels: chartData.value.value_bands.map(d => d.band),
  datasets: [{
    label: 'Contracts',
    data: chartData.value.value_bands.map(d => d.count),
    backgroundColor: '#10b98199',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 3,
  }],
}))

const topSectorsData = computed(() => ({
  labels: chartData.value.top_sectors.map(d => d.sector),
  datasets: [{
    label: 'Contracts',
    data: chartData.value.top_sectors.map(d => d.count),
    backgroundColor: '#f59e0b99',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 3,
  }],
}))

// Dissertation historical + forecast data (forecasting_analysis.py results)
const HIST_YEARS    = [2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026]
const HIST_RATES    = [42.5,45.2,47.8,50.1,52.8,55.4,58.1,60.2,62.3,63.4,63.8]
const FCST_YEARS    = [2027,2028,2029,2030]
const FCST_RATES    = [64.0,64.1,64.2,64.3]
const FCST_CI_LO    = [55.2,51.1,48.3,47.4]
const FCST_CI_HI    = [72.8,77.1,80.1,81.3]

const allYears = [...HIST_YEARS, ...FCST_YEARS]

const smeHistoricalData = {
  labels: allYears,
  datasets: [
    {
      label: 'Historical SME Rate (%)',
      data: [...HIST_RATES, ...Array(FCST_YEARS.length).fill(null)],
      borderColor: '#2563eb',
      backgroundColor: '#2563eb22',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#2563eb',
    },
    {
      label: 'Forecast',
      data: [...Array(HIST_YEARS.length - 1).fill(null), HIST_RATES[HIST_RATES.length - 1], ...FCST_RATES],
      borderColor: '#93c5fd',
      backgroundColor: 'transparent',
      borderDash: [5, 4],
      tension: 0.3,
      pointRadius: 3,
      pointBackgroundColor: '#93c5fd',
    },
    {
      label: 'CI Lower',
      data: [...Array(HIST_YEARS.length).fill(null), ...FCST_CI_LO],
      borderColor: 'transparent',
      backgroundColor: '#2563eb11',
      fill: '+1',
      pointRadius: 0,
      tension: 0.3,
    },
    {
      label: 'CI Upper',
      data: [...Array(HIST_YEARS.length).fill(null), ...FCST_CI_HI],
      borderColor: '#2563eb44',
      backgroundColor: '#2563eb11',
      borderDash: [2, 3],
      fill: false,
      pointRadius: 0,
      tension: 0.3,
    },
  ],
}

// ── Chart options ────────────────────────────────────────────────────────────

const horizontalBarOpts = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw}%` } } },
  scales: { x: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } }, y: { ticks: { font: { size: 11 } } } },
}

const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
}

const donutOpts = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } },
  },
  cutout: '65%',
}

const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom', labels: { font: { size: 11 }, boxWidth: 14, padding: 12 } },
    tooltip: { callbacks: { label: ctx => ctx.raw != null ? ` ${ctx.dataset.label}: ${ctx.raw}%` : '' } },
  },
  scales: {
    y: { beginAtZero: false, min: 35, max: 90, ticks: { callback: v => v + '%' } },
    x: { ticks: { font: { size: 11 } } },
  },
}

// ── Static insight cards ─────────────────────────────────────────────────────

const insights = [
  {
    icon: '🤖', title: 'Model Accuracy', value: '72.1% AUC',
    desc: 'XGBoost predicts SME award with 68.7% recall across 514k contracts',
    bg: 'bg-blue-50', label: 'text-blue-600', border: 'border-blue-400',
  },
  {
    icon: '📈', title: '2030 Forecast', value: '64.3%',
    desc: 'National SME rate projected by ARIMA(0,1,1) — up from 42.5% in 2016',
    bg: 'bg-emerald-50', label: 'text-emerald-600', border: 'border-emerald-400',
  },
  {
    icon: '💷', title: 'Value Effect', value: '2.3×',
    desc: 'Lower-value contracts (< £100k) are 2.3× more likely to be awarded to SMEs',
    bg: 'bg-amber-50', label: 'text-amber-600', border: 'border-amber-400',
  },
  {
    icon: '🏛️', title: 'Authorities', value: '3,412',
    desc: 'UK buying authorities grouped into 4 SME-friendliness clusters by K-Means',
    bg: 'bg-purple-50', label: 'text-purple-600', border: 'border-purple-400',
  },
]

const clusters = [
  { name: 'SME Champions', rate: '64.9%', count: '1,167', bg: 'bg-emerald-50 border-emerald-200', label: 'text-emerald-600', value: 'text-emerald-700', sub: 'text-emerald-500' },
  { name: 'SME Friendly',  rate: '39.8%', count: '78',    bg: 'bg-blue-50 border-blue-200',     label: 'text-blue-600',    value: 'text-blue-700',    sub: 'text-blue-500' },
  { name: 'Neutral',       rate: '39.5%', count: '913',   bg: 'bg-amber-50 border-amber-200',   label: 'text-amber-600',   value: 'text-amber-700',   sub: 'text-amber-500' },
  { name: 'Large-Focused', rate: '13.7%', count: '1,254', bg: 'bg-red-50 border-red-200',       label: 'text-red-600',     value: 'text-red-700',     sub: 'text-red-500' },
]

// ── Data fetch ───────────────────────────────────────────────────────────────

async function fetchStats() {
  loading.value = true
  apiError.value = ''
  try {
    const res = await dashboardApi.getStats()
    stats.value = res.data
  } catch (e) {
    const status = e.response?.status
    const msg = e.response?.data?.detail || e.message || 'Unknown error'
    apiError.value = status
      ? `API error ${status}: ${msg}`
      : `Network error: ${msg} — check VITE_API_URL and Railway CORS`
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchStats()
  interval = setInterval(fetchStats, 30 * 60 * 1000)
})
onUnmounted(() => clearInterval(interval))
</script>
