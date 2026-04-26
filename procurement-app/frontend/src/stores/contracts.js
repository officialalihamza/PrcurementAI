import { defineStore } from 'pinia'
import { ref } from 'vue'
import { contractsApi } from '@/lib/api'

export const useContractsStore = defineStore('contracts', () => {
  const contracts = ref([])
  const savedContracts = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    keyword: '',
    cpv: [],
    regions: [],
    value_min: 0,
    value_max: 10000000,
    sme_flag: 'all',
    status_filter: 'all',
    sort: 'newest',
    page: 1,
  })

  async function search(params = {}) {
    loading.value = true
    error.value = null
    try {
      const query = { ...filters.value, ...params }
      const res = await contractsApi.search(query)
      contracts.value = res.data.contracts || []
      total.value = res.data.total || 0
    } catch (e) {
      error.value = e.response?.data?.detail || 'Search failed'
    } finally {
      loading.value = false
    }
  }

  async function fetchSaved() {
    try {
      const res = await contractsApi.getSaved()
      savedContracts.value = res.data.saved || []
    } catch {}
  }

  async function saveContract(contract, notes = '') {
    await contractsApi.save(contract, notes)
    await fetchSaved()
  }

  async function removeSaved(id) {
    await contractsApi.deleteSaved(id)
    savedContracts.value = savedContracts.value.filter(c => c.id !== id)
  }

  function isSaved(ocid) {
    return savedContracts.value.some(c => c.ocid === ocid)
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function resetFilters() {
    filters.value = {
      keyword: '',
      cpv: [],
      regions: [],
      value_min: 0,
      value_max: 10000000,
      sme_flag: 'all',
      status_filter: 'all',
      sort: 'newest',
      page: 1,
    }
  }

  return {
    contracts, savedContracts, total, loading, error, filters,
    search, fetchSaved, saveContract, removeSaved, isSaved, setFilters, resetFilters,
  }
})
