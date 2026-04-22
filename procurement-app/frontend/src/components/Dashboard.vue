<template>
  <div class="space-y-6">

    <!-- API error banner -->
    <div v-if="apiError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-mono">
      {{ apiError }}
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="kpi in kpis" :key="kpi.label" class="card p-5">
        <p class="text-sm font-medium text-gray-500">{{ kpi.label }}</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ kpi.value }}</p>
        <p class="mt-1 text-xs text-gray-400">{{ kpi.sub }}</p>
      </div>
    </div>

    <!-- Charts row 1 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">SME Rate by Region</h3>
        <div v-if="chartData.sme_by_region.length" class="h-64">
          <Bar :data="smeByRegionData" :options="horizontalBarOpts" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-400 text-sm">No data</div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">Contract Value Bands</h3>
        <div v-if="chartData.value_bands.length" class="h-64">
          <Bar :data="valueBandsData" :options="barOpts" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-400 text-sm">No data</div>
      </div>
    </div>

    <!-- Charts row 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">Top 10 Sectors</h3>
        <div v-if="chartData.top_sectors.length" class="h-64">
          <Bar :data="topSectorsData" :options="horizontalBarOpts" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-400 text-sm">No data</div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-4">SME Rate Over Time</h3>
        <div v-if="chartData.sme_over_time.length" class="h-64">
          <Line :data="smeOverTimeData" :options="lineOpts" />
        </div>
        <div v-else class="h-64 flex items-center justify-center text-gray-400 text-sm">
          <p>Live trend data loads from analytics</p>
        </div>
      </div>
    </div>

    <p class="text-xs text-gray-400 text-right">
      Last updated: {{ lastUpdated }} · Auto-refreshes every 30 min
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend,
} from 'chart.js'
import { dashboardApi } from '@/lib/api'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

const stats = ref(null)
const loading = ref(false)
const apiError = ref('')
let interval = null

const lastUpdated = computed(() => {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
})

const kpis = computed(() => {
  const k = stats.value?.kpis || {}
  return [
    { label: 'Contracts This Week', value: k.week_count ?? '—', sub: 'New opportunities' },
    { label: 'SME Win Rate', value: k.sme_rate != null ? k.sme_rate + '%' : '—', sub: 'Across all contracts' },
    { label: 'Avg Contract Value', value: k.avg_value != null ? '£' + k.avg_value.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : '—', sub: 'Mean award value' },
    { label: 'Total Spend', value: k.total_spend != null ? '£' + (k.total_spend / 1e6).toFixed(1) + 'M' : '—', sub: 'Total contract value' },
  ]
})

const chartData = computed(() => ({
  sme_by_region: stats.value?.charts?.sme_by_region || [],
  sme_over_time: stats.value?.charts?.sme_over_time || [],
  value_bands: stats.value?.charts?.value_bands || [],
  top_sectors: stats.value?.charts?.top_sectors || [],
}))

const smeByRegionData = computed(() => ({
  labels: chartData.value.sme_by_region.map(d => d.region),
  datasets: [{
    label: 'SME Rate (%)',
    data: chartData.value.sme_by_region.map(d => d.sme_rate.toFixed(1)),
    backgroundColor: '#2563eb99',
    borderColor: '#2563eb',
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
  }],
}))

const smeOverTimeData = computed(() => ({
  labels: chartData.value.sme_over_time.map(d => d.year),
  datasets: [{
    label: 'SME Rate (%)',
    data: chartData.value.sme_over_time.map(d => d.sme_rate),
    borderColor: '#2563eb',
    backgroundColor: '#2563eb22',
    fill: true,
    tension: 0.3,
  }],
}))

const horizontalBarOpts = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true } },
}

const barOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true } },
}

const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, max: 100 } },
}

async function fetchStats() {
  loading.value = true
  apiError.value = ''
  try {
    const res = await dashboardApi.getStats()
    stats.value = res.data
  } catch (e) {
    const status = e.response?.status
    const msg = e.response?.data?.detail || e.message || 'Unknown error'
    apiError.value = status ? `API error ${status}: ${msg}` : `Network error: ${msg} — check VITE_API_URL and Railway CORS`
    console.error('Dashboard stats failed', e)
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
