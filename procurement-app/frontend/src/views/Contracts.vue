<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

    <!-- Page header -->
    <div class="mb-4 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Contract Search</h1>
        <p class="text-gray-500 text-sm mt-0.5">Live data from UK Contracts Finder, Find a Tender &amp; Spend Data</p>
      </div>
      <div class="flex items-center gap-3">
        <p class="text-sm text-gray-500 hidden sm:block">
          {{ activeTab === 'search' ? store.total.toLocaleString() + ' results' : store.savedContracts.length + ' saved' }}
        </p>
        <div class="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button @click="activeTab = 'search'"
            class="px-4 py-1.5 font-medium transition-colors"
            :class="activeTab === 'search' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'">
            Search
          </button>
          <button @click="activeTab = 'saved'; store.fetchSaved()"
            class="px-4 py-1.5 font-medium transition-colors flex items-center gap-1.5"
            :class="activeTab === 'saved' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'">
            Saved
            <span v-if="store.savedContracts.length" class="px-1.5 py-0.5 rounded-full text-xs"
              :class="activeTab === 'saved' ? 'bg-white/20' : 'bg-brand-100 text-brand-700'">
              {{ store.savedContracts.length }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── Filter Bar ── -->
    <div v-if="activeTab === 'search'" class="card p-4 mb-5 space-y-4">

      <!-- Row 1: Keyword search -->
      <div class="flex gap-3">
        <input
          v-model="filters.keyword"
          type="search"
          class="input flex-1"
          placeholder="Search by keyword, buyer, or title…"
          @keyup.enter="doSearch"
        />
        <button @click="doSearch" class="btn-primary px-6 text-sm whitespace-nowrap">Search</button>
        <button @click="resetFilters" class="btn-secondary px-4 text-sm whitespace-nowrap">Reset</button>
      </div>

      <!-- Row 2: Status pill tabs -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Status:</span>
        <button
          v-for="opt in statusOptions" :key="opt.value"
          @click="filters.status_filter = opt.value"
          class="px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all"
          :class="filters.status_filter === opt.value
            ? opt.activeClass
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-800'"
        >
          <span v-if="opt.dot" class="inline-block w-1.5 h-1.5 rounded-full mr-1.5 -mb-px" :class="opt.dot"></span>
          {{ opt.label }}
        </button>
      </div>

      <!-- Row 3: Primary filters -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div>
          <label class="label text-xs">Location / City</label>
          <input
            v-model="filters.region"
            type="text"
            class="input text-sm py-1.5"
            placeholder="e.g. London, Manchester…"
            @keyup.enter="doSearch"
          />
        </div>
        <div>
          <label class="label text-xs">Data Source</label>
          <select v-model="filters.source" class="input text-sm py-1.5">
            <option v-for="opt in sourceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div>
          <label class="label text-xs">SME suitability</label>
          <select v-model="filters.sme_flag" class="input text-sm py-1.5">
            <option v-for="opt in smeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div>
          <label class="label text-xs">Sort by</label>
          <select v-model="filters.sort" class="input text-sm py-1.5">
            <option value="newest">Newest first</option>
            <option value="value">Highest value</option>
            <option value="deadline">Deadline soon</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="showMore = !showMore"
            class="w-full btn-secondary text-sm py-1.5 flex items-center justify-center gap-2"
          >
            <svg class="w-3.5 h-3.5 transition-transform" :class="showMore ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
            {{ showMore ? 'Fewer filters' : 'More filters' }}
            <span v-if="activeMoreCount" class="ml-1 px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-full text-xs">{{ activeMoreCount }}</span>
          </button>
        </div>
      </div>

      <!-- Row 4: Expandable advanced filters -->
      <div v-if="showMore" class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
        <div>
          <label class="label text-xs">Min value (£)</label>
          <input v-model.number="filters.value_min" type="number" class="input text-sm py-1.5" placeholder="0" />
        </div>
        <div>
          <label class="label text-xs">Max value (£)</label>
          <input v-model.number="filters.value_max" type="number" class="input text-sm py-1.5" placeholder="No limit" />
        </div>
        <div>
          <label class="label text-xs">Published from</label>
          <input v-model="filters.date_from" type="date" class="input text-sm py-1.5" />
        </div>
        <div>
          <label class="label text-xs">CPV code</label>
          <input
            v-model="filters.cpv_code"
            type="text"
            class="input text-sm py-1.5"
            placeholder="e.g. 72 or 72100000"
            @keyup.enter="doSearch"
          />
        </div>
      </div>

    </div>

    <!-- ── Saved Contracts Tab ── -->
    <div v-if="activeTab === 'saved'">
      <div v-if="store.savedContracts.length" class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50">
              <th class="text-left px-4 py-3 font-medium text-gray-600">Contract</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Buyer / Region</th>
              <th class="text-right px-4 py-3 font-medium text-gray-600">Value</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Deadline</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Saved</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in store.savedContracts" :key="c.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-3 max-w-xs">
                <p class="font-medium text-gray-900 line-clamp-2">{{ c.title || c.ocid }}</p>
                <p v-if="c.notes" class="text-xs text-gray-400 mt-0.5 italic">{{ c.notes }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600 hidden md:table-cell">
                <p class="text-sm">{{ c.buyer || '—' }}</p>
                <p class="text-xs text-gray-500">{{ c.region || '' }}</p>
              </td>
              <td class="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                {{ c.value ? '£' + Number(c.value).toLocaleString('en-GB', { maximumFractionDigits: 0 }) : 'TBC' }}
              </td>
              <td class="px-4 py-3 text-gray-600 whitespace-nowrap text-sm hidden sm:table-cell">
                {{ c.deadline ? new Date(c.deadline).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : 'Open' }}
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden lg:table-cell">
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

    <!-- ── Search Results ── -->
    <div v-else>
      <div class="card overflow-hidden">
        <ContractsList :contracts="store.contracts" :loading="store.loading" />
      </div>

      <div v-if="store.total > 0" class="mt-4 flex items-center justify-between text-sm text-gray-600">
        <button :disabled="currentPage <= 1" @click="changePage(-1)" class="btn-secondary py-1.5 px-3 disabled:opacity-40">
          &larr; Previous
        </button>
        <span>Page {{ currentPage }} &nbsp;&middot;&nbsp; {{ store.total.toLocaleString() }} results</span>
        <button @click="changePage(1)" class="btn-secondary py-1.5 px-3">Next &rarr;</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContractsStore } from '@/stores/contracts'
import ContractsList from '@/components/ContractsList.vue'

const route = useRoute()
const store = useContractsStore()
const currentPage = ref(1)
const activeTab   = ref('search')
const showMore    = ref(false)

const statusOptions = [
  { value: 'active',    label: 'Active / Open', dot: 'bg-green-500',  activeClass: 'bg-green-600 text-white border-green-600' },
  { value: 'complete',  label: 'Awarded',        dot: 'bg-blue-500',   activeClass: 'bg-blue-600 text-white border-blue-600' },
  { value: 'cancelled', label: 'Cancelled',       dot: 'bg-red-400',    activeClass: 'bg-red-600 text-white border-red-600' },
  { value: 'all',       label: 'All statuses',   dot: null,            activeClass: 'bg-gray-800 text-white border-gray-800' },
]

const smeOptions = [
  { value: 'all',   label: 'All contracts' },
  { value: 'sme',   label: 'SME suitable' },
  { value: 'large', label: 'Large only' },
]

const sourceOptions = [
  { value: 'all',                  label: 'All Sources' },
  { value: 'contracts-finder',     label: 'Contracts Finder' },
  { value: 'find-a-tender',        label: 'Find a Tender' },
  { value: 'spend-data',           label: 'Spend Data' },
]

const filters = reactive({
  keyword:       '',
  region:        '',
  value_min:     0,
  value_max:     10000000,
  sme_flag:      'all',
  status_filter: 'active',
  cpv_code:      '',
  sort:          'newest',
  date_from:     '',
  date_to:       '',
  source:        'all',
})

// Count how many "more filters" are actively set (for the badge)
const activeMoreCount = computed(() => {
  let n = 0
  if (filters.value_min > 0) n++
  if (filters.value_max < 10000000) n++
  if (filters.date_from) n++
  if (filters.cpv_code) n++
  return n
})

async function doSearch() {
  currentPage.value = 1
  store.setFilters({
    keyword:       filters.keyword,
    regions:       filters.region ? [filters.region] : [],
    cpv:           filters.cpv_code ? [filters.cpv_code] : [],
    value_min:     filters.value_min,
    value_max:     filters.value_max,
    sme_flag:      filters.sme_flag,
    status_filter: filters.status_filter,
    sort:          filters.sort,
    date_from:     filters.date_from,
    date_to:       filters.date_to,
    source:        filters.source,
    page: 1,
  })
  await store.search()
  await store.fetchSaved()
}

function resetFilters() {
  Object.assign(filters, {
    keyword: '', region: '', value_min: 0, value_max: 10000000,
    sme_flag: 'all', status_filter: 'active', cpv_code: '',
    sort: 'newest', date_from: '', date_to: '', source: 'all',
  })
  showMore.value = false
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
