<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Contract Search</h1>
        <p class="text-gray-500 mt-0.5">Live data from UK Contracts Finder</p>
      </div>
      <div class="flex items-center gap-4">
        <p v-if="activeTab === 'search'" class="text-sm text-gray-500">{{ store.total.toLocaleString() }} results</p>
        <p v-else class="text-sm text-gray-500">{{ store.savedContracts.length }} saved</p>
        <!-- Tab switcher -->
        <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            @click="activeTab = 'search'"
            class="px-4 py-1.5 font-medium transition-colors"
            :class="activeTab === 'search' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          >Search</button>
          <button
            @click="activeTab = 'saved'; store.fetchSaved()"
            class="px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5"
            :class="activeTab === 'saved' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          >
            Saved
            <span v-if="store.savedContracts.length" class="px-1.5 py-0.5 rounded-full text-xs"
              :class="activeTab === 'saved' ? 'bg-white/20' : 'bg-brand-100 text-brand-700'">
              {{ store.savedContracts.length }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Saved contracts tab -->
    <div v-if="activeTab === 'saved'">
      <div v-if="store.savedContracts.length" class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Contract</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Buyer / Region</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Value</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Deadline</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Saved</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in store.savedContracts" :key="c.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 max-w-xs">
                <p class="font-medium text-gray-900 line-clamp-2">{{ c.title || c.ocid }}</p>
                <p v-if="c.notes" class="text-xs text-gray-400 mt-0.5 italic">{{ c.notes }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">
                <p class="text-sm">{{ c.buyer || '—' }}</p>
                <p class="text-xs text-gray-500">{{ c.region || '' }}</p>
              </td>
              <td class="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                {{ c.value ? '£' + Number(c.value).toLocaleString('en-GB', { maximumFractionDigits: 0 }) : 'TBC' }}
              </td>
              <td class="px-4 py-3 text-gray-600 whitespace-nowrap text-sm">
                {{ c.deadline ? new Date(c.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : 'Open' }}
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {{ new Date(c.saved_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) }}
              </td>
              <td class="px-4 py-3">
                <button @click="store.removeSaved(c.id)" class="text-xs text-red-500 hover:text-red-700 transition-colors">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card p-16 text-center text-gray-400 text-sm">
        No saved contracts yet — click the bookmark icon on any contract to save it.
      </div>
    </div>

    <div v-else class="flex gap-6">
      <!-- Sidebar filters -->
      <aside class="w-64 flex-shrink-0 hidden lg:block">
        <div class="card p-4 space-y-5 sticky top-20">
          <div>
            <label class="label">Keyword search</label>
            <input v-model="filters.keyword" type="search" class="input" placeholder="e.g. cloud, security…" @keyup.enter="doSearch" />
          </div>

          <div>
            <label class="label">Region</label>
            <div class="space-y-1 max-h-40 overflow-y-auto">
              <label v-for="region in regions" :key="region" class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" :value="region" v-model="filters.regions" class="rounded text-brand-600" />
                {{ region }}
              </label>
            </div>
          </div>

          <div>
            <label class="label">Value range</label>
            <div class="space-y-2">
              <div class="flex gap-2">
                <input v-model.number="filters.value_min" type="number" class="input text-sm" placeholder="Min £" />
                <input v-model.number="filters.value_max" type="number" class="input text-sm" placeholder="Max £" />
              </div>
            </div>
          </div>

          <div>
            <label class="label">SME suitability</label>
            <div class="space-y-1">
              <label v-for="opt in smeOptions" :key="opt.value" class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" :value="opt.value" v-model="filters.sme_flag" class="text-brand-600" />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <div>
            <label class="label">Sort by</label>
            <select v-model="filters.sort" class="input text-sm">
              <option value="newest">Newest first</option>
              <option value="value">Highest value</option>
              <option value="deadline">Deadline soon</option>
            </select>
          </div>

          <div>
            <label class="label">Date range</label>
            <div class="space-y-2">
              <input v-model="filters.date_from" type="date" class="input text-sm" />
              <input v-model="filters.date_to" type="date" class="input text-sm" />
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="doSearch" class="btn-primary flex-1 text-sm py-2">Search</button>
            <button @click="resetFilters" class="btn-secondary text-sm py-2">Reset</button>
          </div>
        </div>
      </aside>

      <!-- Results -->
      <div class="flex-1 min-w-0">
        <!-- Mobile filters toggle -->
        <button @click="showMobileFilters = !showMobileFilters" class="lg:hidden btn-secondary w-full mb-4 text-sm">
          {{ showMobileFilters ? 'Hide filters' : 'Show filters' }}
        </button>

        <div v-if="showMobileFilters" class="lg:hidden card p-4 mb-4 space-y-4">
          <div>
            <label class="label">Keyword</label>
            <input v-model="filters.keyword" type="search" class="input" placeholder="Search…" />
          </div>
          <div>
            <label class="label">SME filter</label>
            <select v-model="filters.sme_flag" class="input">
              <option v-for="opt in smeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </div>
          <button @click="doSearch" class="btn-primary w-full text-sm">Search</button>
        </div>

        <div class="card overflow-hidden">
          <ContractsList :contracts="store.contracts" :loading="store.loading" />
        </div>

        <!-- Pagination -->
        <div v-if="store.total > 0" class="mt-4 flex items-center justify-between text-sm text-gray-600">
          <button
            :disabled="currentPage <= 1"
            @click="changePage(-1)"
            class="btn-secondary py-1.5 px-3 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span>Page {{ currentPage }}</span>
          <button
            @click="changePage(1)"
            class="btn-secondary py-1.5 px-3"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContractsStore } from '@/stores/contracts'
import ContractsList from '@/components/ContractsList.vue'

const route = useRoute()
const store = useContractsStore()
const showMobileFilters = ref(false)
const currentPage = ref(1)
const activeTab = ref('search')

const regions = [
  'East Midlands', 'East of England', 'London', 'North East',
  'North West', 'Northern Ireland', 'Scotland', 'South East',
  'South West', 'Wales', 'West Midlands', 'Yorkshire and the Humber',
]

const smeOptions = [
  { value: 'all', label: 'All contracts' },
  { value: 'sme', label: 'SME suitable' },
  { value: 'large', label: 'Large only' },
]

const filters = reactive({
  keyword: '',
  regions: [],
  value_min: 0,
  value_max: 10000000,
  sme_flag: 'all',
  sort: 'newest',
  date_from: '',
  date_to: '',
})

async function doSearch() {
  currentPage.value = 1
  store.setFilters({ ...filters, page: 1 })
  await store.search()
  await store.fetchSaved()
}

function resetFilters() {
  Object.assign(filters, {
    keyword: '', regions: [], value_min: 0, value_max: 10000000,
    sme_flag: 'all', sort: 'newest', date_from: '', date_to: '',
  })
  doSearch()
}

async function changePage(delta) {
  currentPage.value += delta
  store.setFilters({ page: currentPage.value })
  await store.search()
  window.scrollTo(0, 0)
}

onMounted(async () => {
  if (route.query.date_from) filters.date_from = route.query.date_from
  if (route.query.date_to)   filters.date_to   = route.query.date_to
  if (route.query.date_from || route.query.date_to) {
    store.setFilters({ ...filters, page: 1 })
  }
  await store.search()
  await store.fetchSaved()
})
</script>
