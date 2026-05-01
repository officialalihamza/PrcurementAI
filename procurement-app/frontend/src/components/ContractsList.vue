<template>
  <div>
    <!-- Table -->
    <div v-if="contracts.length" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="text-left px-4 py-3 font-medium text-gray-600">Contract</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Buyer / Region</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">CPV / Sector</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Value</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Deadline</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">SME</th>
            <th class="text-center px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Match</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="contract in contracts"
            :key="contract.ocid"
            class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            @click="openDetail(contract)"
          >
            <!-- Contract title + doc count badge -->
            <td class="px-4 py-3 max-w-xs">
              <div class="flex items-start gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 mb-0.5">
                    <span :class="sourceBadge(contract.source).cls"
                      class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase flex-shrink-0">
                      {{ sourceBadge(contract.source).label }}
                    </span>
                  </div>
                  <p class="font-medium text-gray-900 line-clamp-2 text-sm">{{ contract.title }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <p class="text-xs text-gray-400 hidden md:block">{{ contract.buyer }}</p>
                    <span v-if="contract.documents?.length"
                      class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 flex-shrink-0">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      {{ contract.documents.length }}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            <!-- Buyer / Region -->
            <td class="px-4 py-3 text-gray-600 hidden md:table-cell">
              <p class="text-sm font-medium text-gray-700 line-clamp-1">{{ contract.buyer }}</p>
              <p class="text-xs text-gray-400">{{ contract.region }}</p>
            </td>

            <!-- CPV Code -->
            <td class="px-4 py-3 hidden lg:table-cell">
              <template v-if="contract.cpv_codes?.length">
                <p class="text-xs font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded inline-block">{{ contract.cpv_codes[0] }}</p>
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-1">{{ contract.cpv_descriptions?.[0] || '' }}</p>
              </template>
              <span v-else class="text-gray-300 text-xs">—</span>
            </td>

            <!-- Value -->
            <td class="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
              {{ formatValue(contract.value) }}
            </td>

            <!-- Deadline -->
            <td class="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell">
              <span :class="deadlineClass(contract.deadline)">
                {{ formatDate(contract.deadline) }}
              </span>
            </td>

            <!-- Status -->
            <td class="px-4 py-3 text-center">
              <span v-if="contract.status" class="inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                :class="statusBadge(contract.status).cls">
                {{ statusBadge(contract.status).label }}
              </span>
              <span v-else class="text-gray-300 text-xs">—</span>
            </td>

            <!-- SME -->
            <td class="px-4 py-3 text-center hidden lg:table-cell">
              <span v-if="contract.sme_suitable === true" class="badge-sme">SME</span>
              <span v-else-if="contract.sme_suitable === false" class="badge-large">Large</span>
              <span v-else class="text-gray-300 text-xs" title="SME suitability not specified in this notice">—</span>
            </td>

            <!-- Match score -->
            <td class="px-4 py-3 text-center hidden xl:table-cell">
              <div v-if="contract.match_score > 0" class="flex items-center justify-center gap-1">
                <div class="w-14 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full transition-all"
                    :class="scoreColor(contract.match_score)"
                    :style="{ width: contract.match_score + '%' }" />
                </div>
                <span class="text-xs font-medium" :class="scoreTextColor(contract.match_score)">
                  {{ contract.match_score }}
                </span>
              </div>
              <span v-else class="text-gray-300 text-xs" title="Complete your company profile with SIC codes to see match scores">—</span>
            </td>

            <!-- Save bookmark -->
            <td class="px-4 py-3" @click.stop>
              <button @click="toggleSave(contract)"
                class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                :title="savedOcids.has(contract.ocid) ? 'Unsave' : 'Save'">
                <svg class="w-4 h-4" :class="savedOcids.has(contract.ocid) ? 'text-brand-600 fill-brand-600' : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty -->
    <div v-else-if="!loading" class="text-center py-16">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-3 text-gray-500">No contracts found. Try adjusting your filters.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-12">
      <svg class="animate-spin mx-auto h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <p class="mt-2 text-gray-500 text-sm">Loading contracts…</p>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="selected = null">
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-start justify-between gap-4 mb-4">
              <h2 class="text-lg font-bold text-gray-900">{{ selected.title }}</h2>
              <button @click="selected = null" class="text-gray-400 hover:text-gray-600 flex-shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="space-y-1">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Buyer</p>
                <p class="font-medium">{{ selected.buyer }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Region</p>
                <p class="font-medium">{{ selected.region }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Value</p>
                <p class="font-bold text-xl text-gray-900">{{ formatValue(selected.value) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Deadline</p>
                <p class="font-medium" :class="deadlineClass(selected.deadline)">{{ formatDate(selected.deadline) }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-gray-500 uppercase tracking-wide">SME Suitable</p>
                <span v-if="selected.sme_suitable === true" class="badge-sme">Yes</span>
                <span v-else-if="selected.sme_suitable === false" class="badge-large">No</span>
                <span v-else class="text-xs text-gray-400 italic">Not specified in notice</span>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                <p class="font-medium capitalize">{{ selected.status || '—' }}</p>
              </div>
            </div>

            <div v-if="selected.description" class="mb-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Description</p>
              <p class="text-sm text-gray-700">{{ selected.description }}</p>
            </div>

            <div v-if="selected.cpv_codes?.length" class="mb-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">CPV Codes</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(code, i) in selected.cpv_codes"
                  :key="code"
                  class="px-2 py-1 bg-gray-100 rounded text-xs font-mono"
                >
                  {{ code }} <span v-if="selected.cpv_descriptions?.[i]" class="text-gray-500">— {{ selected.cpv_descriptions[i] }}</span>
                </span>
              </div>
            </div>

            <!-- Documents -->
            <div v-if="selected.documents?.length" class="mb-4">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">
                Documents
                <span class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono">
                  {{ selected.documents.length }}
                </span>
              </p>
              <div class="space-y-1.5">
                <a
                  v-for="doc in selected.documents"
                  :key="doc.url"
                  :href="doc.url"
                  target="_blank"
                  rel="noopener"
                  class="flex items-start gap-2 p-2 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
                >
                  <!-- icon -->
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div class="min-w-0">
                    <p class="text-xs font-medium text-gray-700 group-hover:text-blue-700 truncate">
                      {{ doc.label || doc.type || 'Document' }}
                    </p>
                    <p v-if="doc.title" class="text-xs text-gray-400 truncate">{{ doc.title }}</p>
                    <p class="text-xs text-blue-500 truncate">{{ doc.url }}</p>
                  </div>
                  <svg class="w-3 h-3 flex-shrink-0 mt-0.5 text-gray-300 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              </div>
            </div>

            <div class="flex gap-3 pt-4 border-t border-gray-100">
              <a
                v-if="selected.url"
                :href="selected.url"
                target="_blank"
                rel="noopener"
                class="btn-primary flex-1 text-center"
              >
                View on {{ sourceBadge(selected.source).site }} ↗
              </a>
              <button @click="toggleSave(selected)" class="btn-secondary">
                {{ savedOcids.has(selected.ocid) ? 'Unsave' : 'Save contract' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useContractsStore } from '@/stores/contracts'

const props = defineProps({
  contracts: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const contractsStore = useContractsStore()
const selected = ref(null)

const savedOcids = computed(() => new Set(contractsStore.savedContracts.map(c => c.ocid)))

function openDetail(contract) {
  selected.value = contract
}

async function toggleSave(contract) {
  if (savedOcids.value.has(contract.ocid)) {
    const saved = contractsStore.savedContracts.find(c => c.ocid === contract.ocid)
    if (saved) await contractsStore.removeSaved(saved.id)
  } else {
    await contractsStore.saveContract(contract)
  }
}

function sourceBadge(source) {
  if (source === 'find-a-tender')    return { label: 'FaT',   cls: 'bg-purple-100 text-purple-700', site: 'Find a Tender' }
  if (source === 'spend-data')       return { label: 'Spend', cls: 'bg-amber-100  text-amber-700',  site: 'data.gov.uk' }
  return                                    { label: 'CF',    cls: 'bg-teal-100   text-teal-700',   site: 'Contracts Finder' }
}

function statusBadge(status) {
  const s = (status || '').toLowerCase()
  if (s === 'active')                          return { label: 'Active',       cls: 'bg-green-100 text-green-700' }
  if (s === 'tender')                          return { label: 'Open',         cls: 'bg-emerald-100 text-emerald-700' }
  if (s === 'complete')                        return { label: 'Complete',     cls: 'bg-blue-100 text-blue-700' }
  if (s === 'award' || s === 'contractsigned') return { label: 'Awarded',      cls: 'bg-blue-100 text-blue-700' }
  if (s.includes('cancel'))                    return { label: 'Cancelled',    cls: 'bg-red-100 text-red-700' }
  if (s === 'unsuccessful')                    return { label: 'Unsuccessful', cls: 'bg-red-100 text-red-700' }
  if (s === 'withdrawn')                       return { label: 'Withdrawn',    cls: 'bg-amber-100 text-amber-700' }
  if (s === 'planning')                        return { label: 'Planning',     cls: 'bg-purple-100 text-purple-700' }
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'
  return { label, cls: 'bg-gray-100 text-gray-600' }
}

function formatValue(val) {
  if (!val) return 'TBC'
  return '£' + val.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

function formatDate(date) {
  if (!date) return 'Open'
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function deadlineClass(date) {
  if (!date) return 'text-gray-600'
  const days = (new Date(date) - Date.now()) / 86400000
  if (days < 7) return 'text-red-600 font-medium'
  if (days < 30) return 'text-amber-600 font-medium'
  return 'text-gray-700'
}

function scoreColor(score) {
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-amber-400'
  return 'bg-red-400'
}

function scoreTextColor(score) {
  if (score >= 70) return 'text-green-700'
  if (score >= 40) return 'text-amber-700'
  return 'text-red-700'
}
</script>
