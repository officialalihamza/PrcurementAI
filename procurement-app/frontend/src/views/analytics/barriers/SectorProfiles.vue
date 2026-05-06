<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Sector Barrier Profiles</h1>
        <p class="text-gray-500 text-sm mt-0.5">SME barriers by CPV sector — radar charts + ranked comparison</p>
      </div>
      <RouterLink to="/analytics/barriers" class="btn-secondary text-sm">← Back to Overview</RouterLink>
    </div>

    <div v-if="loading" class="card p-16 text-center animate-pulse">
      <div class="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
      <div class="h-64 bg-gray-100 rounded"></div>
    </div>

    <div v-else>

      <!-- Sector selector -->
      <div class="card p-4 mb-5">
        <div class="flex items-center gap-3 flex-wrap">
          <label class="label text-xs mb-0 whitespace-nowrap">Compare sectors:</label>
          <div class="flex gap-1.5 flex-wrap">
            <button v-for="s in sectors" :key="s.sector"
              @click="toggleSector(s.sector)"
              class="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
              :class="selectedSectors.has(s.sector)
                ? (s.composite > 60 ? 'bg-red-600 text-white border-red-600' : s.composite > 35 ? 'bg-amber-500 text-white border-amber-500' : 'bg-green-600 text-white border-green-600')
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'">
              {{ s.sector.split(' ').slice(0, 2).join(' ') }}
            </button>
          </div>
          <button @click="resetSelection" class="text-xs text-brand-600 hover:underline">Reset</button>
        </div>
      </div>

      <!-- Radar chart + ranking side by side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Barrier Profile Radar</h3>
          <p class="text-xs text-gray-400 mb-3">Higher = more barriers. Select sectors above to compare.</p>
          <div ref="chartRadar" style="height:360px"></div>
        </div>

        <div class="card p-5">
          <h3 class="font-semibold text-gray-900 mb-1">Composite Barrier Score Ranking</h3>
          <p class="text-xs text-gray-400 mb-3">0 = no barriers, 100 = maximum barriers</p>
          <div class="space-y-2 overflow-y-auto" style="max-height:340px">
            <div v-for="(s, i) in [...sectors].sort((a,b) => b.composite - a.composite)" :key="s.sector"
              class="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
              :class="selectedSectors.has(s.sector) ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50'"
              @click="toggleSector(s.sector)">
              <span class="text-sm font-bold w-6 text-center" :class="i < 3 ? 'text-red-600' : i >= sectors.length - 3 ? 'text-green-600' : 'text-gray-500'">
                {{ i + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-medium text-gray-800 truncate">{{ s.sector }}</span>
                  <span class="text-sm font-bold whitespace-nowrap"
                    :class="s.composite > 60 ? 'text-red-600' : s.composite > 35 ? 'text-amber-600' : 'text-green-600'">
                    {{ s.composite }}/100
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  <div class="flex-1 h-1.5 bg-gray-100 rounded-full">
                    <div class="h-full rounded-full"
                      :class="s.composite > 60 ? 'bg-red-400' : s.composite > 35 ? 'bg-amber-400' : 'bg-green-400'"
                      :style="{ width: s.composite + '%' }"></div>
                  </div>
                  <span class="text-xs text-gray-400 whitespace-nowrap">{{ s.sme_rate }}% SME</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full sector table -->
      <div class="card overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100">
          <h3 class="font-semibold text-gray-900">All Sector Barrier Scores</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" @click="sort('sector')">
                  Sector <span class="text-gray-400 text-xs">{{ sortIcon('sector') }}</span>
                </th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" @click="sort('sme_rate')">
                  SME Rate <span class="text-gray-400 text-xs">{{ sortIcon('sme_rate') }}</span>
                </th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell cursor-pointer" @click="sort('bundling')">
                  Bundling
                </th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 hidden md:table-cell cursor-pointer" @click="sort('stringency')">
                  Stringency
                </th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Complexity</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Framework</th>
                <th class="text-right px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900" @click="sort('composite')">
                  Composite <span class="text-gray-400 text-xs">{{ sortIcon('composite') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sortedSectors" :key="s.sector"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                :class="selectedSectors.has(s.sector) ? 'bg-brand-50/30' : ''">
                <td class="px-4 py-3 font-medium text-gray-900 text-sm">{{ s.sector }}</td>
                <td class="px-4 py-3 text-right font-semibold" :class="s.sme_rate >= 60 ? 'text-green-700' : s.sme_rate >= 35 ? 'text-blue-700' : 'text-red-700'">
                  {{ s.sme_rate }}%
                </td>
                <td class="px-4 py-3 text-right hidden md:table-cell">
                  <span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="barrierCls(s.bundling)">{{ s.bundling.toFixed(2) }}</span>
                </td>
                <td class="px-4 py-3 text-right hidden md:table-cell">
                  <span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="barrierCls(s.stringency)">{{ s.stringency.toFixed(2) }}</span>
                </td>
                <td class="px-4 py-3 text-right hidden lg:table-cell">
                  <span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="barrierCls(s.complexity)">{{ s.complexity.toFixed(2) }}</span>
                </td>
                <td class="px-4 py-3 text-right hidden lg:table-cell">
                  <span class="font-mono text-xs px-1.5 py-0.5 rounded" :class="barrierCls(s.framework)">{{ s.framework.toFixed(2) }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-12 h-1.5 rounded-full bg-gray-200 hidden sm:block">
                      <div class="h-full rounded-full" :class="s.composite > 60 ? 'bg-red-500' : s.composite > 35 ? 'bg-amber-500' : 'bg-green-500'"
                        :style="{ width: s.composite + '%' }"></div>
                    </div>
                    <span class="font-bold" :class="s.composite > 60 ? 'text-red-600' : s.composite > 35 ? 'text-amber-600' : 'text-green-600'">
                      {{ s.composite }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { barriersApi } from '@/lib/api'

const sectors        = ref([])
const loading        = ref(true)
const selectedSectors= ref(new Set(['IT Services', 'Construction', 'R&D Services']))
const chartRadar     = ref(null)
const sortKey        = ref('composite')
const sortDir        = ref(-1)
let Plotly = null

const RADAR_DIMS = ['bundling', 'stringency', 'complexity', 'timeline', 'framework']
const DIM_LABELS = ['Bundling', 'Stringency', 'Complexity', 'Timeline', 'Framework']
const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', '#06b6d4']

const sortedSectors = computed(() => {
  return [...sectors.value].sort((a, b) => sortDir.value * (
    typeof a[sortKey.value] === 'string'
      ? a[sortKey.value].localeCompare(b[sortKey.value])
      : (b[sortKey.value] - a[sortKey.value]) * -sortDir.value
  ))
})

function sort(key) {
  if (sortKey.value === key) sortDir.value *= -1
  else { sortKey.value = key; sortDir.value = -1 }
}
function sortIcon(key) {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === -1 ? '↓' : '↑'
}

function barrierCls(v) {
  if (v >= 0.6) return 'bg-red-100 text-red-700'
  if (v >= 0.35) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

function toggleSector(s) {
  const ns = new Set(selectedSectors.value)
  if (ns.has(s)) { if (ns.size > 1) ns.delete(s) }
  else ns.add(s)
  selectedSectors.value = ns
}

function resetSelection() {
  selectedSectors.value = new Set(['IT Services', 'Construction', 'R&D Services'])
}

async function drawRadar() {
  if (!chartRadar.value) return
  if (!Plotly) Plotly = (await import('plotly.js-dist-min')).default
  const visible = sectors.value.filter(s => selectedSectors.value.has(s.sector))
  if (!visible.length) return

  const traces = visible.map((s, i) => ({
    type: 'scatterpolar', fill: 'toself',
    name: s.sector,
    r: [...RADAR_DIMS.map(d => s[d]), s[RADAR_DIMS[0]]],
    theta: [...DIM_LABELS, DIM_LABELS[0]],
    line: { color: COLORS[i % COLORS.length], width: 2 },
    fillcolor: COLORS[i % COLORS.length] + '22',
  }))

  Plotly.newPlot(chartRadar.value, traces, {
    paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
    font: { family: 'Inter,system-ui,sans-serif', size: 11, color: '#374151' },
    polar: { radialaxis: { range: [0, 1], tickfont: { size: 9 } }, bgcolor: 'rgba(0,0,0,0)' },
    showlegend: true, legend: { orientation: 'h', y: -0.15 },
    margin: { l: 30, r: 30, t: 30, b: 60 },
  }, { responsive: true, displayModeBar: false })
}

watch(selectedSectors, () => drawRadar(), { deep: true })

onMounted(async () => {
  try {
    const res = await barriersApi.sectorProfiles()
    sectors.value = res.data.sectors || []
  } catch {}
  loading.value = false
  await nextTick()
  await new Promise(r => setTimeout(r, 50))
  drawRadar()
})
</script>
