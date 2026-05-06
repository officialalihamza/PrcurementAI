<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <div class="mb-5 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Procurement Language Detector</h1>
        <p class="text-gray-500 text-sm mt-0.5">Paste any contract specification — AI-powered detection of SME-unfriendly language patterns</p>
      </div>
      <RouterLink to="/analytics/barriers" class="btn-secondary text-sm">← Back to Overview</RouterLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Input panel -->
      <div class="space-y-4">
        <div class="card p-5">
          <div class="flex items-center justify-between mb-2">
            <label class="font-semibold text-gray-900 text-sm">Contract Specification Text</label>
            <div class="flex gap-2">
              <button @click="loadExample" class="text-xs text-brand-600 hover:underline">Load example</button>
              <button @click="clearAll"    class="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
          </div>
          <textarea
            v-model="specText"
            rows="18"
            class="input resize-none font-mono text-sm leading-relaxed"
            placeholder="Paste contract specification, ITT, or procurement notice text here…

Example:
The successful supplier must demonstrate a minimum of 7 years' relevant experience delivering similar projects to central government.

Annual turnover must be at least £2 million in each of the last 2 financial years.

Suppliers must hold ISO 9001 and Cyber Essentials Plus certification at the point of contract award.

This is an extension of the existing contract arrangement with our current supplier…"></textarea>
          <div class="flex items-center justify-between mt-2">
            <p class="text-xs text-gray-400">{{ wordCount }} words</p>
            <button @click="analyseText" :disabled="analysing || specText.trim().length < 20"
              class="btn-primary px-6"
              :class="analysing || specText.trim().length < 20 ? 'opacity-60 cursor-not-allowed' : ''">
              {{ analysing ? 'Analysing…' : '🔍 Analyse' }}
            </button>
          </div>
        </div>

        <!-- Score summary (only after analysis) -->
        <div v-if="result" class="card p-5"
          :class="result.risk_level === 'Low' ? 'bg-green-50 border border-green-200' : result.risk_level === 'Medium' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-900">Analysis Summary</h3>
            <span class="px-3 py-1 rounded-full text-sm font-bold"
              :class="result.risk_level === 'Low' ? 'bg-green-200 text-green-800' : result.risk_level === 'Medium' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'">
              {{ result.risk_level }} Risk
            </span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div>
              <p class="text-2xl font-extrabold" :class="result.overall_score >= 65 ? 'text-green-600' : result.overall_score >= 35 ? 'text-amber-600' : 'text-red-600'">
                {{ result.overall_score }}/100
              </p>
              <p class="text-xs text-gray-500 mt-0.5">SME-Friendliness</p>
            </div>
            <div>
              <p class="text-2xl font-extrabold text-gray-900">{{ result.barrier_count }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Barrier Instances</p>
            </div>
            <div>
              <p class="text-2xl font-extrabold text-gray-900">{{ result.total_words }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Words</p>
            </div>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div class="bg-white/60 rounded-lg p-2 text-center">
              <p class="text-xs text-gray-500">Reading Level</p>
              <p class="font-semibold text-gray-800">{{ result.readability?.level }}</p>
            </div>
            <div class="bg-white/60 rounded-lg p-2 text-center">
              <p class="text-xs text-gray-500">Avg Sentence</p>
              <p class="font-semibold text-gray-800">{{ result.readability?.avg_sentence_length }} words</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Results panel -->
      <div class="space-y-4">

        <!-- Positive indicators (if any) -->
        <div v-if="result && result.positive_indicators?.length" class="card p-4 bg-green-50 border border-green-200">
          <h4 class="font-semibold text-green-800 text-sm mb-2">✅ Positive SME Indicators Found</h4>
          <div class="flex flex-wrap gap-2">
            <span v-for="pos in result.positive_indicators" :key="pos"
              class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {{ pos }}
            </span>
          </div>
        </div>

        <!-- Barriers detected -->
        <div v-if="result && result.barriers_detected?.length" class="space-y-3">
          <h3 class="font-semibold text-gray-900">⚠️ Barriers Detected ({{ result.barriers_detected.length }})</h3>
          <div v-for="barrier in result.barriers_detected" :key="barrier.type"
            class="card p-4 border-l-4"
            :class="severityBorder(barrier.severity)">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 text-xs font-bold rounded-full" :class="severityBadge(barrier.severity)">
                  {{ barrier.severity.toUpperCase() }}
                </span>
                <h4 class="font-semibold text-gray-900 text-sm">{{ barrier.label }}</h4>
              </div>
              <span class="text-xs text-gray-400 whitespace-nowrap">{{ barrier.count }} instance{{ barrier.count > 1 ? 's' : '' }}</span>
            </div>

            <!-- Matched text snippets -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              <code v-for="match in barrier.matches" :key="match"
                class="px-2 py-0.5 text-xs rounded text-gray-700 font-mono"
                :class="barrier.severity === 'high' ? 'bg-red-50' : barrier.severity === 'medium' ? 'bg-amber-50' : 'bg-blue-50'">
                "{{ match }}"
              </code>
            </div>

            <!-- Suggestion -->
            <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p class="text-xs font-semibold text-blue-700 mb-0.5">💡 Suggested Rewrite</p>
              <p class="text-xs text-blue-800 leading-relaxed">{{ barrier.suggestion }}</p>
            </div>
          </div>
        </div>

        <!-- Highlighted text -->
        <div v-if="result && result.highlighted_html" class="card p-5">
          <h4 class="font-semibold text-gray-900 text-sm mb-2">Highlighted Specification Text</h4>
          <div class="flex gap-3 text-xs mb-3 flex-wrap">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded inline-block" style="background:#fecaca"></span> High severity</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded inline-block" style="background:#fef08a"></span> Medium severity</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded inline-block" style="background:#bfdbfe"></span> Low severity</span>
          </div>
          <div class="prose prose-sm max-w-none text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg overflow-y-auto max-h-80"
            v-html="result.highlighted_html"></div>
        </div>

        <!-- No result yet -->
        <div v-if="!result" class="card p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200">
          <div class="text-5xl mb-3">📝</div>
          <p class="font-medium text-gray-500">Paste specification text and click Analyse</p>
          <p class="text-sm text-gray-400 mt-1">The system will detect SME-unfriendly language patterns and suggest rewrites</p>
        </div>

      </div>
    </div>

    <!-- Examples -->
    <div class="card p-5 mt-5">
      <h3 class="font-semibold text-gray-900 mb-3">Common SME-Unfriendly Patterns</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="ex in examples" :key="ex.label" class="rounded-xl border p-3" :class="ex.cls">
          <p class="text-xs font-bold mb-1" :class="ex.textCls">{{ ex.label }}</p>
          <p class="text-xs font-mono italic text-gray-700">"{{ ex.bad }}"</p>
          <p class="text-xs text-gray-500 mt-1">→ {{ ex.fix }}</p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { barriersApi } from '@/lib/api'

const specText  = ref('')
const result    = ref(null)
const analysing = ref(false)
const wordCount = computed(() => specText.value.trim().split(/\s+/).filter(Boolean).length)

const exampleText = `Supplier Requirements and Selection Criteria

The successful supplier must demonstrate a minimum of 7 years' relevant experience delivering similar managed service contracts to UK central government departments.

Annual turnover must be at least £3 million in each of the last 2 consecutive financial years. Relevant financial information will be verified through Companies House.

Suppliers must hold ISO 9001:2015, ISO 27001, and Cyber Essentials Plus certification at the point of contract award. Evidence of current CHAS registration is also required.

This contract is a renewal and continuation of our existing managed IT services arrangement. The incumbent supplier's infrastructure knowledge will be considered during evaluation.

The framework agreement will be used via a call-off mechanism under the Crown Commercial Service RM6111 Lot 3b. Only suppliers on this framework are eligible to submit responses.

Submissions must be received no later than 14 working days from the date of this notice. Late submissions will not be considered under any circumstances.`

function loadExample() { specText.value = exampleText }
function clearAll()    { specText.value = ''; result.value = null }

function severityBorder(sev) {
  return { high: 'border-red-400', medium: 'border-amber-400', low: 'border-blue-300' }[sev] || 'border-gray-300'
}
function severityBadge(sev) {
  return { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' }[sev] || 'bg-gray-100 text-gray-600'
}

async function analyseText() {
  if (!specText.value.trim() || specText.value.trim().length < 20) return
  analysing.value = true
  try {
    const res = await barriersApi.analyzeLanguage(specText.value)
    result.value = res.data
  } catch (e) {
    result.value = { error: e.response?.data?.detail || 'Analysis failed' }
  }
  analysing.value = false
}

const examples = [
  { label: 'Experience Requirement', bad: 'minimum 5 years experience', fix: 'Demonstrate capability through case studies', cls: 'bg-red-50 border-red-200', textCls: 'text-red-700' },
  { label: 'Turnover Threshold',     bad: 'annual turnover of at least £2M', fix: 'Proportionate financial assessment (PPN 11/20)', cls: 'bg-red-50 border-red-200', textCls: 'text-red-700' },
  { label: 'Framework Lock-in',      bad: 'via Crown Commercial Service framework only', fix: 'Consider open competition alongside framework', cls: 'bg-amber-50 border-amber-200', textCls: 'text-amber-700' },
  { label: 'Incumbent Language',     bad: 'continuation of existing contract arrangement', fix: 'Restate scope neutrally; avoid continuity signals', cls: 'bg-amber-50 border-amber-200', textCls: 'text-amber-700' },
  { label: 'Certification Required', bad: 'must hold ISO 9001 and Cyber Essentials Plus', fix: 'Accept equivalents; allow post-award attainment', cls: 'bg-amber-50 border-amber-200', textCls: 'text-amber-700' },
  { label: 'Short Timeline',         bad: '14 working days from publication', fix: 'Minimum 30 days for above-threshold contracts', cls: 'bg-blue-50 border-blue-200', textCls: 'text-blue-700' },
]
</script>
