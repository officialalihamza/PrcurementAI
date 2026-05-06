<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Institutional Barrier Comparison</h1>
        <p class="text-gray-500 text-sm mt-0.5">Central Government vs Local Government vs NHS — who creates the most barriers?</p>
      </div>
      <RouterLink to="/analytics/barriers" class="btn-secondary text-sm">← Back to Overview</RouterLink>
    </div>

    <div v-if="loading" class="card p-16 text-center animate-pulse">
      <div class="h-64 bg-gray-100 rounded"></div>
    </div>

    <div v-else>
      <!-- Authority KPI cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div v-for="auth in authoritiesSorted" :key="auth.authority_type"
          class="card p-5 border-t-4"
          :class="compositeBorder(auth.composite)">
          <div class="flex items-center justify-between mb-2">
            <p class="font-semibold text-gray-900 text-sm">{{ auth.authority_type }}</p>
            <span class="px-2 py-0.5 rounded-full text-xs font-bold"
              :class="compositeBadge(auth.composite)">
              {{ auth.composite > 60 ? 'High Barrier' : auth.composite > 35 ? 'Medium' : 'Low Barrier' }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-y-2 text-sm">
            <div>
              <p class="text-xs text-gray-400">SME Rate</p>
              <p class="font-bold" :class="auth.sme_rate >= 55 ? 'text-green-600' : auth.sme_rate >= 35 ? 'text-blue-600' : 'text-red-600'">
                {{ auth.sme_rate }}%
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Barrier Score</p>
              <p class="font-bold" :class="auth.composite > 60 ? 'text-red-600' : auth.composite > 35 ? 'text-amber-600' : 'text-green-600'">
                {{ auth.composite }}/100
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Avg Value</p>
              <p class="font-semibold text-gray-800">£{{ fmtNum(auth.avg_value) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Contracts</p>
              <p class="font-semibold text-gray-800">{{ fmtNum(auth.contracts) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Grouped bar chart: barrier dimensions by authority type -->
      <div class="card p-5 mb-5">
        <h3 class="font-semibold text-gray-900 mb-1">Barrier Dimensions by Authority Type</h3>
        <p class="text-xs text-gray-400 mb-3">Each cluster = one barrier; bars = authority type. Higher = more restrictive.</p>
        <div ref="chartGrouped" style="height:360px"></div>
      </div>

      <!-- SME rate vs composite scatter -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">SME Rate vs Composite Barrier Score</h3>
          <p class="text-xs text-gray-400 mb-3">Negative correlation — higher barriers → lower SME rates</p>
          <div ref="chartScatter" style="height:300px"></div>
        </div>

        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-3">Institutional Insights</h3>
          <div class="space-y-4">
            <div v-for="auth in authoritiesSorted" :key="auth.authority_type"
              class="rounded-xl p-4 border"
              :class="auth.composite > 60 ? 'bg-red-50 border-red-200' : auth.composite > 35 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'">
              <p class="font-semibold text-gray-900 text-sm mb-1">{{ auth.authority_type }}</p>
              <p class="text-sm text-gray-700 leading-relaxed">{{ auth.insight }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed comparison table -->
      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-900">Detailed Barrier Comparison</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-4 py-3 font-medium text-gray-600">Authority Type</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">SME Rate</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Bundling</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Stringency</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Complexity</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Framework</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600">Composite</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Avg £</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in authoritiesSorted" :key="a.authority_type"
                class="border-b border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900">{{ a.authority_type }}</td>
                <td class="px-4 py-3 text-right font-semibold"
                  :class="a.sme_rate >= 55 ? 'text-green-600' : a.sme_rate >= 35 ? 'text-blue-600' : 'text-red-600'">
                  {{ a.sme_rate }}%
                </td>
                <td class="px-4 py-3 text-right"><span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="dimCls(a.bundling)">{{ a.bundling?.toFixed(2) }}</span></td>
                <td class="px-4 py-3 text-right"><span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="dimCls(a.stringency)">{{ a.stringency?.toFixed(2) }}</span></td>
                <td class="px-4 py-3 text-right hidden md:table-cell"><span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="dimCls(a.complexity)">{{ a.complexity?.toFixed(2) }}</span></td>
                <td class="px-4 py-3 text-right hidden md:table-cell"><span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="dimCls(a.framework)">{{ a.framework?.toFixed(2) }}</span></td>
                <td class="px-4 py-3 text-right font-bold" :class="a.composite > 60 ? 'text-red-600' : a.composite > 35 ? 'text-amber-600' : 'text-green-600'">
                  {{ a.composite }}
                </td>
                <td class="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">£{{ fmtNum(a.avg_value) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { barriersApi } from '@/lib/api'

const authorities = ref([])
const loading     = ref(true)
const chartGrouped= ref(null)
const chartScatter= ref(null)
let Plotly = null

const authoritiesSorted = computed(() =>
  [...authorities.value].sort((a, b) => b.composite - a.composite)
)

function fmtNum(n) {
  if (!n) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k'
  return n.toLocaleString()
}

function compositeBorder(v) {
  if (v > 60) return 'border-t-red-500'
  if (v > 35) return 'border-t-amber-500'
  return 'border-t-green-500'
}
function compositeBadge(v) {
  if (v > 60) return 'bg-red-100 text-red-700'
  if (v > 35) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}
function dimCls(v) {
  if (!v && v !== 0) return 'bg-gray-100 text-gray-600'
  if (v >= 0.6) return 'bg-red-100 text-red-700'
  if (v >= 0.35) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

async function drawCharts() {
  if (!Plotly) Plotly = (await import('plotly.js-dist-min')).default
  const AUTH_COLORS = { 'Central Government': '#dc2626', 'NHS': '#d97706', 'Emergency Services': '#9333ea', 'Education': '#2563eb', 'Local Government': '#16a34a', 'Other Public Sector': '#6b7280' }
  const dims   = ['bundling', 'stringency', 'complexity', 'timeline', 'framework']
  const labels = ['Bundling', 'Stringency', 'Complexity', 'Timeline', 'Framework']
  const auths  = authorities.value

  // Grouped bar
  if (chartGrouped.value && auths.length) {
    const traces = auths.map(a => ({
      type: 'bar', name: a.authority_type,
      x: labels,
      y: dims.map(d => a[d] || 0),
      marker: { color: AUTH_COLORS[a.authority_type] || '#6b7280' },
    }))
    Plotly.newPlot(chartGrouped.value, traces, {
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#374151' },
      barmode: 'group',
      yaxis: { title: { text: 'Barrier Score (0–1)' }, range: [0, 1] },
      legend: { orientation: 'h', y: -0.2 },
      margin: { l: 50, r: 20, t: 10, b: 80 },
    }, { responsive: true, displayModeBar: false })
  }

  // Scatter: composite vs SME rate
  if (chartScatter.value && auths.length) {
    Plotly.newPlot(chartScatter.value, [{
      type: 'scatter', mode: 'markers+text',
      x: auths.map(a => a.composite),
      y: auths.map(a => a.sme_rate),
      text: auths.map(a => a.authority_type.split(' ').map(w => w[0]).join('')),
      textposition: 'top center',
      marker: { size: 14, color: auths.map(a => AUTH_COLORS[a.authority_type] || '#6b7280') },
      customdata: auths.map(a => a.authority_type),
      hovertemplate: '<b>%{customdata}</b><br>Barrier: %{x}<br>SME Rate: %{y}%<extra></extra>',
    }], {
      paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#374151' },
      xaxis: { title: { text: 'Composite Barrier Score' } },
      yaxis: { title: { text: 'SME Award Rate (%)' } },
      margin: { l: 55, r: 20, t: 20, b: 50 },
    }, { responsive: true, displayModeBar: false })
  }
}

onMounted(async () => {
  try {
    const res = await barriersApi.authorityProfiles()
    authorities.value = res.data.authorities || []
  } catch {}
  loading.value = false
  await new Promise(r => setTimeout(r, 50))
  drawCharts()
})
</script>
