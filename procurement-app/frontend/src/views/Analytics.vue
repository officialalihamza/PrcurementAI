<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Market Analytics</h1>
        <p class="text-gray-500 mt-0.5">UK Public Procurement · SME Participation · 2016–{{ currentYear }}</p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <div class="text-xs text-right text-gray-500">
          <div class="flex items-center gap-1 justify-end">
            <span v-if="status.data_source === 'live'" class="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
            <span v-else class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            <span>{{ status.data_source === 'live' ? 'Live · ' + relativeTime(status.last_updated) : 'Pre-computed (CSV)' }}</span>
          </div>
          <div class="text-gray-400">{{ (status.record_count || 0).toLocaleString() }} records</div>
        </div>
        <button @click="triggerRefresh" :disabled="status.is_refreshing || refreshing"
          class="btn-secondary flex items-center gap-1.5 text-sm"
          title="Download latest OCDS data and recompute">
          <svg class="w-4 h-4" :class="(status.is_refreshing || refreshing) ? 'animate-spin' : ''"
               fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ (status.is_refreshing || refreshing) ? 'Refreshing…' : 'Refresh Data' }}
        </button>
      </div>
    </div>

    <!-- Refresh log / error -->
    <div v-if="status.is_refreshing && status.log?.length"
      class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 font-mono space-y-0.5">
      <div v-for="line in status.log" :key="line">{{ line }}</div>
    </div>
    <div v-if="status.error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
      Refresh error: {{ status.error }}
    </div>

    <!-- ── Filters bar ── -->
    <div class="card p-4 mb-6 flex flex-wrap gap-4 items-end">
      <div>
        <label class="label">Year from</label>
        <select v-model.number="filters.year_min" class="input text-sm py-1.5" @change="applyFilters">
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div>
        <label class="label">Year to</label>
        <select v-model.number="filters.year_max" class="input text-sm py-1.5" @change="applyFilters">
          <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div>
        <label class="label">Source</label>
        <select v-model="filters.source" class="input text-sm py-1.5" @change="applyFilters">
          <option value="">All sources</option>
          <option value="cf">Contracts Finder</option>
          <option value="fts">Find a Tender</option>
        </select>
      </div>
      <div>
        <label class="label">Region</label>
        <select v-model="filters.region" class="input text-sm py-1.5" @change="applyFilters">
          <option value="">All regions</option>
          <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <button @click="resetFilters" class="btn-secondary text-sm py-1.5 px-3">Reset</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="card p-5 h-24 animate-pulse bg-gray-100 rounded-xl"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div v-for="i in 6" :key="i" class="card p-5 h-64 animate-pulse bg-gray-100 rounded-xl"></div>
      </div>
    </div>

    <template v-else-if="stats">
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Total Contracts</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ fmt(stats.record_count) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ filters.year_min }}–{{ filters.year_max }}</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">SME Awards</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">{{ fmt(stats.totals?.sme) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ smeOverallPct }}% of known</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">National Avg SME Rate</p>
          <p class="text-2xl font-bold text-indigo-600 mt-1">{{ stats.national_avg_sme_rate }}%</p>
          <p class="text-xs text-gray-400 mt-0.5">Govt target: 33%</p>
        </div>
        <div class="card p-5">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Trend / year</p>
          <p class="text-2xl font-bold text-green-600 mt-1">+{{ stats.regression?.slope }}%</p>
          <p class="text-xs text-gray-400 mt-0.5">R² = {{ stats.regression?.r_squared }}</p>
        </div>
      </div>

      <!-- Charts grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        <!-- 1. Donut -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">SME vs Large Split</h3>
          <p class="text-xs text-gray-400 mb-3">{{ fmt(stats.record_count) }} award contracts · {{ filters.year_min }}–{{ filters.year_max }}</p>
          <div ref="chartDonut" style="height:260px"></div>
        </div>

        <!-- 2. Value Bands -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">SME Rate by Contract Value Band <span class="text-xs font-normal text-gray-400">(RQ2)</span></h3>
          <p class="text-xs text-gray-400 mb-3">SME participation declines as contract size grows</p>
          <div ref="chartBands" style="height:260px"></div>
        </div>

        <!-- 3. Over time — full width -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-1">SME Award Rate Over Time <span class="text-xs font-normal text-gray-400">(RQ3)</span></h3>
          <p class="text-xs text-gray-400 mb-3">Annual SME rate (line) with total contract volume (grey bars)</p>
          <div ref="chartTimeline" style="height:280px"></div>
        </div>

        <!-- 4. Top Sectors -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Top 15 CPV Sectors by SME Rate <span class="text-xs font-normal text-gray-400">(RQ1)</span></h3>
          <p class="text-xs text-gray-400 mb-3">Sectors with ≥ 100 awarded contracts</p>
          <div ref="chartSectors" style="height:340px"></div>
        </div>

        <!-- 5. Regional -->
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">SME Rate by UK Region <span class="text-xs font-normal text-gray-400">(RQ1)</span></h3>
          <p class="text-xs text-gray-400 mb-3">National avg {{ stats.national_avg_sme_rate }}% (dashed)</p>
          <div ref="chartRegion" style="height:340px"></div>
        </div>

        <!-- 6. Stacked — full width -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-1">SME vs Large Award Volume by Year</h3>
          <p class="text-xs text-gray-400 mb-3">Absolute award counts — growing SME share</p>
          <div ref="chartStacked" style="height:260px"></div>
        </div>

        <!-- 7. Source by year — full width -->
        <div class="card p-5 lg:col-span-2">
          <h3 class="font-semibold text-gray-900 mb-1">Award Contracts per Year by Source</h3>
          <p class="text-xs text-gray-400 mb-3">Contracts Finder (below-threshold) vs Find a Tender (above-threshold, from 2021)</p>
          <div ref="chartSource" style="height:260px"></div>
        </div>

      </div>

      <!-- Key findings -->
      <div class="card p-6">
        <h3 class="font-semibold text-gray-900 mb-4">Key Research Findings</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <p class="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Finding 1 — Overall</p>
            <p class="text-sm text-gray-700">SMEs received <strong>{{ fmt(stats.totals?.sme) }}</strong> of <strong>{{ fmt(stats.record_count) }}</strong> contracts (<strong>{{ smeOverallPct }}%</strong>), exceeding the government's 33% direct spend target by volume.</p>
          </div>
          <div class="bg-amber-50 rounded-lg p-4">
            <p class="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Finding 2 — Contract Size (RQ2)</p>
            <p class="text-sm text-gray-700">Participation peaks at <strong>{{ stats.sme_by_band?.[0]?.sme_rate }}%</strong> under £10k, falling to <strong>{{ stats.sme_by_band?.[5]?.sme_rate }}%</strong> over £25M — structural barriers at scale confirmed (χ² p&lt;0.001).</p>
          </div>
          <div class="bg-green-50 rounded-lg p-4">
            <p class="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Finding 3 — Temporal Trend (RQ3)</p>
            <p class="text-sm text-gray-700">Rate rose from <strong>{{ stats.sme_by_year?.[0]?.sme_rate }}%</strong> ({{ stats.sme_by_year?.[0]?.year }}) to <strong>{{ stats.sme_by_year?.at(-1)?.sme_rate }}%</strong> ({{ stats.sme_by_year?.at(-1)?.year }}), +<strong>{{ stats.regression?.slope }}% per year</strong> (R²={{ stats.regression?.r_squared }}).</p>
          </div>
          <div class="bg-purple-50 rounded-lg p-4">
            <p class="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">Finding 4 — Sector Variation (RQ1)</p>
            <p class="text-sm text-gray-700">Rates range from near <strong>100%</strong> (project supervision, local transport) to below <strong>30%</strong> (IT, infrastructure). Fragmented, smaller-value sectors favour SMEs.</p>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="error" class="card p-8 text-center">
      <p class="text-red-600 mb-3">{{ error }}</p>
      <button @click="loadStats" class="btn-primary">Retry</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch } from 'vue'
import { analyticsApi } from '@/lib/api'

// ── State ──────────────────────────────────────────────────────────────────
const stats     = ref(null)
const status    = ref({ data_source: 'fallback', record_count: 0, is_refreshing: false })
const loading   = ref(true)
const refreshing = ref(false)
const error     = ref('')
const currentYear = new Date().getFullYear()

const yearOptions = Array.from({ length: currentYear - 2015 }, (_, i) => 2016 + i)
const regionOptions = [
  'East Midlands','East of England','London','North East','North West',
  'Northern Ireland','Scotland','South East','South West','Wales',
  'West Midlands','Yorkshire and The Humber',
]

const filters = reactive({
  year_min: 2016,
  year_max: currentYear,
  source: '',
  region: '',
})

// ── Chart refs ─────────────────────────────────────────────────────────────
const chartDonut    = ref(null)
const chartBands    = ref(null)
const chartTimeline = ref(null)
const chartSectors  = ref(null)
const chartRegion   = ref(null)
const chartStacked  = ref(null)
const chartSource   = ref(null)

let Plotly = null
let pollTimer = null

// ── Computed ───────────────────────────────────────────────────────────────
const smeOverallPct = computed(() => {
  if (!stats.value?.totals) return '—'
  const { sme, large } = stats.value.totals
  if (!sme && !large) return '—'
  return ((sme / (sme + large)) * 100).toFixed(1)
})

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString()
}

function relativeTime(iso) {
  if (!iso) return 'never'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Data loading ────────────────────────────────────────────────────────────
async function loadStats() {
  loading.value = true
  error.value   = ''
  try {
    const params = {
      year_min: filters.year_min,
      year_max: filters.year_max,
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.region ? { region: filters.region } : {}),
    }
    const [statsRes, statusRes] = await Promise.all([
      analyticsApi.getStats(params),
      analyticsApi.getStatus(),
    ])
    stats.value  = statsRes.data
    status.value = statusRes.data
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to load analytics'
  } finally {
    loading.value = false
  }
}

async function applyFilters() {
  if (filters.year_min > filters.year_max) filters.year_max = filters.year_min
  await loadStats()
}

function resetFilters() {
  Object.assign(filters, { year_min: 2016, year_max: currentYear, source: '', region: '' })
  loadStats()
}

// ── Refresh / poll ──────────────────────────────────────────────────────────
async function triggerRefresh() {
  refreshing.value = true
  try {
    await analyticsApi.refresh()
    startPolling()
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to start refresh'
    refreshing.value = false
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    try {
      const res  = await analyticsApi.getStatus()
      status.value = res.data
      if (!res.data.is_refreshing) {
        stopPolling()
        refreshing.value = false
        await loadStats()
      }
    } catch (_) {}
  }, 3000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

// ── Chart rendering ──────────────────────────────────────────────────────────
// Use watch with flush:'post' so Plotly runs AFTER the DOM is fully painted.
watch(stats, async (newVal) => {
  if (!newVal) return
  if (!Plotly) {
    try { Plotly = (await import('plotly.js-dist-min')).default }
    catch { return }
  }
  renderAll(newVal)
}, { flush: 'post' })

const BLUE  = '#2563eb'
const RED   = '#dc2626'
const GRAY  = '#cbd5e1'
const AMBER = '#d97706'
const BASE  = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor:  'rgba(0,0,0,0)',
  font:   { family: 'Inter,system-ui,sans-serif', size: 11, color: '#374151' },
  margin: { l: 10, r: 10, t: 10, b: 10 },
}
const CFG = { responsive: true, displayModeBar: false }

function renderAll(s) {
  donut(s); bands(s); timeline(s); sectors(s); regional(s); stacked(s); source(s)
}

function donut(s) {
  if (!chartDonut.value) return
  Plotly.newPlot(chartDonut.value, [{
    type: 'pie', hole: 0.52,
    values: [s.totals.sme, s.totals.large, s.totals.unknown],
    labels: ['SME', 'Large', 'Unknown'],
    marker: { colors: [BLUE, RED, GRAY] },
    textinfo: 'label+percent',
    textposition: 'outside',
    pull: [0.04, 0, 0],
    hovertemplate: '<b>%{label}</b><br>%{value:,} contracts (%{percent})<extra></extra>',
  }], {
    ...BASE,
    margin: { l: 20, r: 20, t: 20, b: 20 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.08 },
  }, CFG)
}

function bands(s) {
  if (!chartBands.value) return
  const b = s.sme_by_band
  Plotly.newPlot(chartBands.value, [
    {
      type: 'bar',
      x: b.map(d => d.band), y: b.map(d => d.sme_rate),
      marker: { color: BLUE },
      text: b.map(d => d.sme_rate + '%'), textposition: 'outside',
      customdata: b.map(d => (d.n || 0).toLocaleString()),
      hovertemplate: '<b>%{x}</b><br>SME Rate: %{y}%<br>n = %{customdata}<extra></extra>',
    },
    {
      type: 'scatter', mode: 'lines',
      x: b.map(d => d.band),
      y: Array(b.length).fill(s.national_avg_sme_rate),
      line: { color: AMBER, dash: 'dash', width: 2 },
      name: `Avg ${s.national_avg_sme_rate}%`,
      hoverinfo: 'none',
    },
  ], {
    ...BASE,
    showlegend: true,
    legend: { x: 0.65, y: 1.05, orientation: 'h' },
    xaxis: { tickfont: { size: 10 } },
    yaxis: { title: { text: 'SME Rate (%)' }, range: [0, 75] },
    margin: { l: 50, r: 20, t: 30, b: 70 },
  }, CFG)
}

function timeline(s) {
  if (!chartTimeline.value) return
  const yr = s.sme_by_year
  Plotly.newPlot(chartTimeline.value, [
    {
      type: 'bar', name: 'Total Contracts',
      x: yr.map(d => d.year), y: yr.map(d => d.total),
      marker: { color: '#e2e8f0' },
      yaxis: 'y2',
      hovertemplate: '<b>%{x}</b><br>Total: %{y:,}<extra></extra>',
    },
    {
      type: 'scatter', mode: 'lines+markers', name: 'SME Rate (%)',
      x: yr.map(d => d.year), y: yr.map(d => d.sme_rate),
      line: { color: BLUE, width: 2.5 },
      marker: { size: 7, color: BLUE },
      text: yr.map(d => d.sme_rate + '%'), textposition: 'top center',
      hovertemplate: '<b>%{x}</b><br>SME Rate: %{y}%<extra></extra>',
    },
  ], {
    ...BASE,
    showlegend: true,
    legend: { x: 0.02, y: 0.98 },
    xaxis: { dtick: 1, tickangle: -45 },
    yaxis:  { title: { text: 'SME Rate (%)' }, range: [0, 80] },
    yaxis2: { title: { text: 'Total Contracts' }, overlaying: 'y', side: 'right', showgrid: false },
    margin: { l: 55, r: 65, t: 20, b: 55 },
  }, CFG)
}

function sectors(s) {
  if (!chartSectors.value || !s.top_sectors?.length) return
  const d = [...s.top_sectors].reverse()
  Plotly.newPlot(chartSectors.value, [{
    type: 'bar', orientation: 'h',
    x: d.map(r => r.sme_rate), y: d.map(r => r.sector),
    marker: { color: BLUE },
    text: d.map(r => r.sme_rate + '%'), textposition: 'outside',
    customdata: d.map(r => (r.n || 0).toLocaleString()),
    hovertemplate: '<b>%{y}</b><br>SME Rate: %{x}%<br>n = %{customdata}<extra></extra>',
  }], {
    ...BASE,
    xaxis: { title: { text: 'SME Rate (%)' }, range: [0, 115] },
    yaxis: { tickfont: { size: 9.5 }, automargin: true },
    margin: { l: 10, r: 55, t: 10, b: 45 },
  }, CFG)
}

function regional(s) {
  if (!chartRegion.value || !s.sme_by_region?.length) return
  const d = [...s.sme_by_region].sort((a, b) => a.sme_rate - b.sme_rate)
  Plotly.newPlot(chartRegion.value, [
    {
      type: 'bar', orientation: 'h',
      x: d.map(r => r.sme_rate), y: d.map(r => r.region),
      marker: { color: BLUE },
      text: d.map(r => r.sme_rate + '%'), textposition: 'outside',
      customdata: d.map(r => (r.n || 0).toLocaleString()),
      hovertemplate: '<b>%{y}</b><br>%{x}%<br>n = %{customdata}<extra></extra>',
    },
    {
      type: 'scatter', mode: 'lines',
      x: [s.national_avg_sme_rate, s.national_avg_sme_rate],
      y: [d[0].region, d[d.length - 1].region],
      line: { color: AMBER, dash: 'dash', width: 2 },
      name: `Avg ${s.national_avg_sme_rate}%`,
      hoverinfo: 'none',
    },
  ], {
    ...BASE,
    showlegend: true,
    legend: { x: 0.45, y: -0.12, orientation: 'h' },
    xaxis: { title: { text: 'SME Rate (%)' }, range: [0, 65] },
    yaxis: { tickfont: { size: 10 }, automargin: true },
    margin: { l: 10, r: 55, t: 10, b: 50 },
  }, CFG)
}

function stacked(s) {
  if (!chartStacked.value) return
  const yr = s.sme_by_year
  Plotly.newPlot(chartStacked.value, [
    {
      type: 'bar', name: 'SME',
      x: yr.map(d => d.year), y: yr.map(d => d.sme),
      marker: { color: BLUE },
      hovertemplate: '<b>%{x}</b><br>SME: %{y:,}<extra></extra>',
    },
    {
      type: 'bar', name: 'Large',
      x: yr.map(d => d.year), y: yr.map(d => d.large),
      marker: { color: RED },
      hovertemplate: '<b>%{x}</b><br>Large: %{y:,}<extra></extra>',
    },
  ], {
    ...BASE,
    barmode: 'stack',
    showlegend: true,
    legend: { x: 0.02, y: 0.98, orientation: 'h' },
    xaxis: { dtick: 1, tickangle: -45 },
    yaxis: { title: { text: 'Contracts' } },
    margin: { l: 60, r: 20, t: 20, b: 55 },
  }, CFG)
}

function source(s) {
  if (!chartSource.value || !s.source_by_year?.length) return
  const yr = s.source_by_year
  Plotly.newPlot(chartSource.value, [
    {
      type: 'bar', name: 'Contracts Finder',
      x: yr.map(d => d.year), y: yr.map(d => d.cf),
      marker: { color: BLUE },
      hovertemplate: '<b>%{x}</b><br>CF: %{y:,}<extra></extra>',
    },
    {
      type: 'bar', name: 'Find a Tender',
      x: yr.map(d => d.year), y: yr.map(d => d.fts),
      marker: { color: AMBER },
      hovertemplate: '<b>%{x}</b><br>FTS: %{y:,}<extra></extra>',
    },
  ], {
    ...BASE,
    barmode: 'group',
    showlegend: true,
    legend: { x: 0.02, y: 0.98, orientation: 'h' },
    xaxis: { dtick: 1, tickangle: -45 },
    yaxis: { title: { text: 'Contracts' } },
    margin: { l: 60, r: 20, t: 20, b: 55 },
  }, CFG)
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(loadStats)
onUnmounted(stopPolling)
</script>
