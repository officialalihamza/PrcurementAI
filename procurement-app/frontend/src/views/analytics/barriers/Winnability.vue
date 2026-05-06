<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">SME Winnability Predictor</h1>
        <p class="text-gray-500 text-sm mt-0.5">Enter contract parameters to predict the probability of SME award</p>
      </div>
      <RouterLink to="/analytics/barriers" class="btn-secondary text-sm">← Back to Overview</RouterLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Input form -->
      <div class="card p-6 space-y-4">
        <h3 class="font-semibold text-gray-900">Contract Parameters</h3>

        <div>
          <label class="label text-xs">CPV Sector *</label>
          <select v-model="form.sector" class="input">
            <option value="">— Select sector —</option>
            <option v-for="s in sectorOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label text-xs">Region</label>
            <select v-model="form.region" class="input">
              <option value="">— Any region —</option>
              <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
            </select>
          </div>
          <div>
            <label class="label text-xs">Authority Type</label>
            <select v-model="form.authority_type" class="input">
              <option v-for="a in authorityOptions" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="label text-xs">Estimated Contract Value (£)</label>
          <input v-model.number="form.value" type="number" min="0" step="10000"
            class="input" placeholder="e.g. 250000" />
          <p class="text-xs text-gray-400 mt-0.5">Value band: <strong>{{ valueBand }}</strong></p>
        </div>

        <div>
          <label class="label text-xs">Timeline (days from publication to submission)</label>
          <input v-model.number="form.timeline_days" type="number" min="1" max="365"
            class="input" placeholder="e.g. 45" />
        </div>

        <!-- Checkbox options -->
        <div class="space-y-2 pt-1">
          <label class="flex items-center gap-3 cursor-pointer select-none">
            <div class="relative">
              <input type="checkbox" v-model="form.framework" class="sr-only peer" />
              <div class="w-10 h-6 bg-gray-200 peer-checked:bg-brand-600 rounded-full transition-colors"></div>
              <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span class="text-sm text-gray-700">Framework agreement procurement route</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer select-none">
            <div class="relative">
              <input type="checkbox" v-model="form.certification" class="sr-only peer" />
              <div class="w-10 h-6 bg-gray-200 peer-checked:bg-brand-600 rounded-full transition-colors"></div>
              <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span class="text-sm text-gray-700">Requires certification / accreditation (ISO, CHAS, etc.)</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer select-none">
            <div class="relative">
              <input type="checkbox" v-model="form.incumbent_language" class="sr-only peer" />
              <div class="w-10 h-6 bg-gray-200 peer-checked:bg-brand-600 rounded-full transition-colors"></div>
              <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span class="text-sm text-gray-700">Incumbent/extension language in spec</span>
          </label>
        </div>

        <button @click="predict" :disabled="predicting || !form.sector"
          class="btn-primary w-full py-3 text-base font-semibold"
          :class="predicting ? 'opacity-60 cursor-not-allowed' : ''">
          {{ predicting ? 'Predicting…' : '▶  Predict SME Probability' }}
        </button>
        <p v-if="!form.sector" class="text-xs text-gray-400 text-center">Select a sector to enable prediction</p>
      </div>

      <!-- Results -->
      <div>
        <!-- Placeholder before first prediction -->
        <div v-if="!result" class="card p-10 h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 text-gray-400">
          <div class="text-5xl mb-3">🎯</div>
          <p class="text-base font-medium text-gray-500">Fill in the form and click Predict</p>
          <p class="text-sm mt-1">The model will estimate the probability that this contract will be awarded to an SME</p>
        </div>

        <!-- Prediction result -->
        <div v-else class="space-y-4">

          <!-- Main probability card -->
          <div class="card p-6 text-center"
            :class="result.risk_level === 'Low' ? 'bg-green-50 border border-green-200' : result.risk_level === 'Medium' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'">

            <p class="text-xs font-bold uppercase tracking-widest mb-1" :class="riskTextCls">
              {{ result.risk_level }} Barrier — {{ result.risk_level === 'Low' ? 'Good Opportunity' : result.risk_level === 'Medium' ? 'Moderate Opportunity' : 'High Barrier' }}
            </p>

            <!-- Gauge -->
            <div class="relative my-4 flex items-center justify-center">
              <svg class="w-48 h-24" viewBox="0 0 200 100">
                <!-- Background arc -->
                <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#e5e7eb" stroke-width="16" stroke-linecap="round"/>
                <!-- Filled arc (percentage of semicircle) -->
                <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none"
                  :stroke="result.risk_level === 'Low' ? '#16a34a' : result.risk_level === 'Medium' ? '#d97706' : '#dc2626'"
                  stroke-width="16" stroke-linecap="round"
                  :stroke-dasharray="`${result.probability_pct * 2.827} 282.7`"/>
                <!-- Needle -->
                <line :x1="100" :y1="100"
                  :x2="100 + 75 * Math.cos(Math.PI - result.probability * Math.PI)"
                  :y2="100 - 75 * Math.sin(result.probability * Math.PI)"
                  stroke="#374151" stroke-width="3" stroke-linecap="round"/>
                <circle cx="100" cy="100" r="5" fill="#374151"/>
              </svg>
            </div>

            <p class="text-5xl font-extrabold" :class="riskTextCls">{{ result.probability_pct }}%</p>
            <p class="text-sm text-gray-500 mt-1">SME award probability</p>
            <p class="text-xs text-gray-400 mt-0.5">95% CI: {{ (result.ci_low * 100).toFixed(0) }}% – {{ (result.ci_high * 100).toFixed(0) }}%</p>

            <div class="mt-3 pt-3 border-t border-current/10">
              <p class="text-sm text-gray-700 font-medium">{{ result.recommendation }}</p>
            </div>
          </div>

          <!-- Sector baseline comparison -->
          <div class="card p-4">
            <div class="flex items-center justify-between mb-2">
              <p class="text-sm font-semibold text-gray-900">vs. Sector Baseline</p>
              <div class="flex items-center gap-3">
                <span class="text-xs text-gray-500">{{ result.sector }} avg: {{ (result.sector_baseline * 100).toFixed(0) }}%</span>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                  :class="result.probability >= result.sector_baseline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                  {{ result.probability >= result.sector_baseline ? '▲' : '▼' }}
                  {{ Math.abs(((result.probability - result.sector_baseline) * 100)).toFixed(0) }}pp
                  {{ result.probability >= result.sector_baseline ? 'above' : 'below' }} baseline
                </span>
              </div>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden relative">
              <div class="h-full bg-gray-300 rounded-full" :style="{ width: result.sector_baseline * 100 + '%' }"></div>
              <div class="absolute top-0 h-full rounded-full transition-all"
                :class="result.probability >= result.sector_baseline ? 'bg-green-500' : 'bg-brand-500'"
                :style="{ left: Math.min(result.sector_baseline, result.probability) * 100 + '%', width: Math.abs(result.probability - result.sector_baseline) * 100 + '%' }">
              </div>
              <div class="absolute top-0 h-full w-0.5 bg-gray-500" :style="{ left: result.sector_baseline * 100 + '%' }"></div>
            </div>
          </div>

          <!-- Factor breakdown -->
          <div class="card p-4">
            <h4 class="font-semibold text-gray-900 text-sm mb-3">Adjustment Factors</h4>
            <div class="space-y-2">
              <div v-for="f in result.factors" :key="f.factor"
                class="flex items-center justify-between gap-3">
                <span class="text-sm text-gray-700 flex-1">{{ f.factor }}</span>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <div class="w-20 h-1.5 bg-gray-100 rounded-full">
                    <div class="h-full rounded-full"
                      :class="f.direction === 'positive' ? 'bg-green-400' : 'bg-red-400'"
                      :style="{ width: Math.abs(f.adjustment) * 200 + '%', maxWidth: '100%' }"></div>
                  </div>
                  <span class="font-mono text-xs font-bold w-12 text-right"
                    :class="f.direction === 'positive' ? 'text-green-600' : 'text-red-600'">
                    {{ f.adjustment >= 0 ? '+' : '' }}{{ (f.adjustment * 100).toFixed(0) }}pp
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Methodology note -->
    <div class="card p-4 mt-5 bg-gray-50 border border-gray-200">
      <p class="text-xs text-gray-500">
        <strong>Model:</strong> Logistic regression trained on 514,875 UK OCDS contracts (2016–2026).
        Baseline probabilities by sector from cross-validated model (AUC = 0.721).
        Adjustments based on empirical effect sizes from the dissertation dataset.
        Confidence intervals (±8pp) reflect model uncertainty at the contract level.
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { barriersApi } from '@/lib/api'

const form = ref({
  sector: '',
  region: '',
  authority_type: 'Local Government',
  value: 0,
  timeline_days: 60,
  framework: false,
  certification: false,
  incumbent_language: false,
})

const result    = ref(null)
const predicting= ref(false)

const sectorOptions = [
  'R&D Services', 'Repair & Maintenance', 'Community Services', 'Architecture & Engineering',
  'Education', 'Environmental Services', 'Health Services', 'Construction', 'Transport',
  'Business Services', 'Medical Equipment', 'Public Administration', 'Software', 'IT Services',
  'Financial Services',
]

const regionOptions = [
  'West Midlands', 'Scotland', 'South West', 'Northern Ireland', 'Wales',
  'East Midlands', 'Yorkshire and the Humber', 'North West', 'East of England',
  'North East', 'South East', 'London',
]

const authorityOptions = [
  'Local Government', 'Education', 'Other Public Sector', 'NHS',
  'Emergency Services', 'Central Government',
]

const valueBand = computed(() => {
  const v = form.value.value
  if (!v || v < 0) return 'unknown'
  if (v < 25_000)     return 'Micro (<£25k)'
  if (v < 213_000)    return 'Small (£25k–£213k)'
  if (v < 1_000_000)  return 'Medium (£213k–£1M)'
  if (v < 5_000_000)  return 'Large (£1M–£5M)'
  return 'Very Large (>£5M)'
})

const riskTextCls = computed(() => {
  if (!result.value) return ''
  return { Low: 'text-green-700', Medium: 'text-amber-700', High: 'text-red-700' }[result.value.risk_level] || ''
})

async function predict() {
  predicting.value = true
  try {
    const res = await barriersApi.predictWinnability(form.value)
    result.value = res.data
  } catch {}
  predicting.value = false
}
</script>
