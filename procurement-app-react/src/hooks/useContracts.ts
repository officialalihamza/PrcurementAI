import { useQuery } from '@tanstack/react-query'
import { contractsApi } from '../services/api'
import { useContractStore } from '../store/contractStore'

interface Filters {
  q: string; sector: string; region: string; sme_flag: string
  status: string; min_value: string; max_value: string; page: number
}

// Map store filter keys → API query parameter names
function buildParams(filters: Filters) {
  const p: Record<string, unknown> = { page: filters.page, page_size: 20 }

  if (filters.q)         p.keyword       = filters.q
  if (filters.sector)    p.sector        = filters.sector
  // API expects repeated param: regions=London — axios sends array correctly
  if (filters.region)    p.regions       = filters.region
  // store uses "true"/"false"; API uses "sme"/"large"
  if (filters.sme_flag === 'true')  p.sme_flag = 'sme'
  if (filters.sme_flag === 'false') p.sme_flag = 'large'
  if (filters.status)    p.status_filter = filters.status
  if (filters.min_value) p.value_min     = Number(filters.min_value)
  if (filters.max_value) p.value_max     = Number(filters.max_value)

  return p
}

export const useContracts = () => {
  const { filters } = useContractStore()
  const params = buildParams(filters)

  return useQuery({
    queryKey: ['contracts', params],
    queryFn: async () => {
      const { data } = await contractsApi.search(params)
      return data
    },
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2,
  })
}

export const useSavedContracts = () =>
  useQuery({
    queryKey: ['saved-contracts'],
    queryFn: async () => {
      const { data } = await contractsApi.getSaved()
      return data.contracts || []
    },
  })
