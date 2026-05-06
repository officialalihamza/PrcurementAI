import { useQuery } from '@tanstack/react-query'
import { contractsApi } from '../services/api'
import { useContractStore } from '../store/contractStore'

export const useContracts = () => {
  const { filters } = useContractStore()
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )
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
