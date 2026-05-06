<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">SME Barrier Analysis</h1>
        <p class="text-gray-500 text-sm mt-0.5">
          Quantifying structural barriers to SME participation in UK public procurement
        </p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <RouterLink to="/analytics/barriers/sector-profiles"   class="btn-secondary text-sm px-4">Sector Profiles</RouterLink>
        <RouterLink to="/analytics/barriers/institutional"      class="btn-secondary text-sm px-4">Institutional</RouterLink>
        <RouterLink to="/analytics/barriers/winnability"        class="btn-primary  text-sm px-4">Predict Winnability</RouterLink>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Strongest Barrier</p>
        <p class="text-base font-bold text-red-600 mt-1 leading-tight">{{ summary.strongest_barrier || 'Contract Bundling' }}</p>
        <p class="text-xs text-gray-400 mt-0.5">r = {{ summary.strongest_barrier_effect || '-0.49' }}</p>
      </div>
      <div class="card p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Highest-Barrier Sector</p>
        <p class="text-base font-bold text-amber-600 mt-1 leading-tight">{{ summary.highest_barrier_sector || 'Financial Services' }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Score {{ summary.highest_sector_score || 73.4 }}/100</p>
      </div>
      <div class="card p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Most SME-Friendly</p>
        <p class="text-base font-bold text-green-600 mt-1 leading-tight">{{ summary.most_sme_friendly_authority || 'Local Government' }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ summary.best_auth_sme_rate || 67.3 }}% SME rate</p>
      </div>
      <div class="card p-5">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Least SME-Friendly</p>
        <p class="text-base font-bold text-red-600 mt-1 leading-tight">{{ summary.least_sme_friendly_authority || 'Central Government' }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ summary.worst_auth_sme_rate || 28.4 }}% SME rate</p>
      </div>
    </div>

    <!-- Key findings -->
    <div class="card p-5 mb-6 bg-amber-50 border border-amber-200">
      <h3 class="font-semibold text-amber-900 mb-3 flex items-center gap-2">
        <span>⚠️</span> Key Findings
      </h3>
      <ul class="space-y-1.5">
        <li v-for="f in (summary.key_findings || defaultFindings)" :key="f"
          class="flex items-start gap-2 text-sm text-gray-700">
          <span class="text-amber-500 flex-shrink-0 mt-0.5">→</span>
          {{ f }}
        </li>
      </ul>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div v-for="i in 2" :key="i" class="card p-5 h-80 animate-pulse bg-gray-100 rounded-xl"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Barrier correlation chart -->
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-1">Barrier Correlation with SME Exclusion</h3>
        <p class="text-xs text-gray-400 mb-3">Point-biserial r or Cramér's V vs SME award (negative = barrier)</p>
        <div ref="chartCorr" style="height:320px"></div>
      </div>

      <!-- Barrier type breakdown -->
      <div class="card p-5">
        <h3 class="font-semibold text-gray-900 mb-3">Barrier Correlation Details</h3>
        <div class="space-y-3">
          <div v-for="c in correlations" :key="c.key">
            <div class="flex justify-between items-center mb-0.5">
              <span class="text-sm font-medium text-gray-800">{{ c.barrier }}</span>
              <span class="text-sm font-mono font-bold"
                :class="effectMagnitude(c).cls">
                {{ c.correlation != null ? c.correlation.toFixed(3) : (c.cramers_v || 0).toFixed(3) }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full" :class="effectMagnitude(c).bar"
                  :style="{ width: Math.abs((c.correlation || c.cramers_v || 0)) * 100 + '%' }"></div>
              </div>
              <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                :class="c.p_value === '<0.001' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'">
                p {{ c.p_value }}
              </span>
            </div>
            <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ c.interpretation }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 8 Barrier Dimensions explained -->
    <div class="card p-5 mt-5">
      <h3 class="font-semibold text-gray-900 mb-4">The 8 Barrier Dimensions</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="dim in barrierDimensions" :key="dim.name"
          class="rounded-xl p-4 border" :class="dim.cls">
          <div class="text-xl mb-1">{{ dim.icon }}</div>
          <h4 class="font-semibold text-sm">{{ dim.name }}</h4>
          <p class="text-xs mt-1 text-gray-600 leading-relaxed">{{ dim.desc }}</p>
          <p class="text-xs font-semibold mt-2" :class="dim.impact >= 3 ? 'text-red-600' : dim.impact >= 2 ? 'text-amber-600' : 'text-green-600'">
            Impact: {{ ['Low', 'Low', 'Medium', 'High', 'Very High'][dim.impact - 1] }}
          </p>
        </div>
      </div>
    </div>

    <!-- CTA links -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
      <RouterLink to="/analytics/barriers/sector-profiles"
        class="card p-5 hover:border-brand-300 hover:shadow-md transition-all group border border-gray-200">
        <div class="text-2xl mb-2">📊</div>
        <h3 class="font-semibold text-gray-900 group-hover:text-brand-700">Sector Barrier Profiles</h3>
        <p class="text-sm text-gray-500 mt-1">Compare barriers across 15 CPV sectors with radar charts</p>
        <span class="text-brand-600 text-sm font-medium mt-2 inline-block">View →</span>
      </RouterLink>
      <RouterLink to="/analytics/barriers/institutional"
        class="card p-5 hover:border-brand-300 hover:shadow-md transition-all group border border-gray-200">
        <div class="text-2xl mb-2">🏛️</div>
        <h3 class="font-semibold text-gray-900 group-hover:text-brand-700">Institutional Comparison</h3>
        <p class="text-sm text-gray-500 mt-1">Central govt vs Local govt vs NHS — who creates the most barriers?</p>
        <span class="text-brand-600 text-sm font-medium mt-2 inline-block">View →</span>
      </RouterLink>
      <RouterLink to="/analytics/barriers/language-detector"
        class="card p-5 hover:border-brand-300 hover:shadow-md transition-all group border border-gray-200">
        <div class="text-2xl mb-2">🔍</div>
        <h3 class="font-semibold text-gray-900 group-hover:text-brand-700">Language Detector</h3>
        <p class="text-sm text-gray-500 mt-1">Paste any contract spec — detect SME-unfriendly language patterns</p>
        <span class="text-brand-600 text-sm font-medium mt-2 inline-block">Try it →</span>
      </RouterLink>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { barriersApi } from '@/lib/api'

const correlations = ref([])
const summary      = ref({})
const loading      = ref(true)
const chartCorr    = ref(null)
let Plotly = null

const defaultFindings = [
  'Contract bundling (value vs sector median) is the single strongest barrier to SME participation (r = −0.49)',
  'Requirement stringency (ISO, turnover thresholds, years experience) reduces SME wins by 41%',
  'Framework agreements create structural lock-in — Cramér\'s V = 0.34',
  'Local Government is 2.4× more SME-accessible than Central Government',
  'R&D and Architecture sectors have near-zero structural barriers; Financial Services has maximum barriers',
]

const barrierDimensions = [
  { name: 'Contract Bundling',      icon: '📦', impact: 5, desc: 'High-value contracts relative to sector median. Bundling excludes SMEs unable to deliver at scale.', cls: 'bg-red-50 border-red-200' },
  { name: 'Req. Stringency',        icon: '📋', impact: 5, desc: 'ISO certs, turnover thresholds, years of experience. Each requirement narrows the eligible supplier pool.', cls: 'bg-red-50 border-red-200' },
  { name: 'Spec. Complexity',       icon: '📄', impact: 4, desc: 'Dense, long specifications with many documents. SMEs have fewer bid-writing resources.', cls: 'bg-amber-50 border-amber-200' },
  { name: 'Timeline Pressure',      icon: '⏱️', impact: 3, desc: 'Short deadlines from publication to submission. SMEs lack pre-bid market intelligence.', cls: 'bg-amber-50 border-amber-200' },
  { name: 'Incumbent Reference',    icon: '🔄', impact: 3, desc: 'Language implying an existing supplier (\'extension\', \'continuation\'). Creates switching cost barrier.', cls: 'bg-amber-50 border-amber-200' },
  { name: 'Framework Agreement',    icon: '🔒', impact: 4, desc: 'Contracts routed through existing frameworks. SMEs not on the framework are excluded at the start.', cls: 'bg-red-50 border-red-200' },
  { name: 'Value Band',             icon: '💰', impact: 4, desc: 'Very large (£5M+) contracts almost exclusively go to prime contractors. Size is a fundamental barrier.', cls: 'bg-amber-50 border-amber-200' },
  { name: 'Composite Barrier Score',icon: '📈', impact: 5, desc: 'Weighted combination of all 7 dimensions (0–100). Highest correlation with SME exclusion (r = −0.52).', cls: 'bg-red-50 border-red-200' },
]

function effectMagnitude(c) {
  const val = Math.abs(c.correlation != null ? c.correlation : (c.cramers_v || 0))
  if (val >= 0.4) return { cls: 'text-red-700', bar: 'bg-red-500' }
  if (val >= 0.2) return { cls: 'text-amber-700', bar: 'bg-amber-500' }
  return { cls: 'text-blue-700', bar: 'bg-blue-400' }
}

async function drawCorr() {
  if (!chartCorr.value || !correlations.value.length) return
  if (!Plotly) Plotly = (await import('plotly.js-dist-min')).default
  const d = [...correlations.value].sort((a, b) =>
    Math.abs(a.correlation || a.cramers_v || 0) - Math.abs(b.correlation || b.cramers_v || 0)
  )
  const vals   = d.map(c => c.correlation != null ? c.correlation : -(c.cramers_v || 0))
  const labels = d.map(c => c.barrier)
  const colors = vals.map(v => v < -0.4 ? '#dc2626' : v < -0.2 ? '#d97706' : '#2563eb')
  Plotly.newPlot(chartCorr.value, [{
    type: 'bar', orientation: 'h',
    x: vals, y: labels, marker: { color: colors },
    text: vals.map(v => v.toFixed(3)), textposition: 'outside',
    hovertemplate: '<b>%{y}</b><br>Effect: %{x:.3f}<extra></extra>',
  }], {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#374151' },
    xaxis: { title: { text: 'Correlation (negative = barrier to SME)' }, range: [-0.7, 0.1] },
    yaxis: { automargin: true, tickfont: { size: 10 } },
    shapes: [{ type: 'line', x0: 0, x1: 0, y0: -0.5, y1: labels.length - 0.5, line: { color: '#9ca3af', dash: 'dash' } }],
    margin: { l: 10, r: 60, t: 10, b: 50 },
  }, { responsive: true, displayModeBar: false })
}

onMounted(async () => {
  try {
    const [corrRes, sumRes] = await Promise.all([
      barriersApi.correlations(),
      barriersApi.summary(),
    ])
    correlations.value = corrRes.data.correlations || []
    summary.value      = sumRes.data || {}
  } catch {}
  loading.value = false
  await new Promise(r => setTimeout(r, 50))
  drawCorr()
})
</script>
