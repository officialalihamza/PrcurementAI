<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Contract Search</h1>
        <p class="text-gray-500 mt-0.5">Live data from UK Contracts Finder</p>
      </div>
      <p class="text-sm text-gray-500">{{ store.total.toLocaleString() }} results</p>
    </div>

    <div class="flex gap-6">
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
import { useContractsStore } from '@/stores/contracts'
import ContractsList from '@/components/ContractsList.vue'

const store = useContractsStore()
const showMobileFilters = ref(false)
const currentPage = ref(1)

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
  await store.search()
  await store.fetchSaved()
})
</script>
