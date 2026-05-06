import { useQuery } from '@tanstack/react-query'
import { barriersApi } from '../services/api'

export const useBarrierCorrelations = () =>
  useQuery({
    queryKey: ['barrier-correlations'],
    queryFn: async () => {
      const { data } = await barriersApi.correlations()
      return data.correlations || []
    },
    staleTime: 1000 * 60 * 30,
  })

export const useSectorProfiles = () =>
  useQuery({
    queryKey: ['sector-profiles'],
    queryFn: async () => {
      const { data } = await barriersApi.sectorProfiles()
      return data.sectors || []
    },
    staleTime: 1000 * 60 * 30,
  })

export const useAuthorityProfiles = () =>
  useQuery({
    queryKey: ['authority-profiles'],
    queryFn: async () => {
      const { data } = await barriersApi.authorityProfiles()
      return data.authorities || []
    },
    staleTime: 1000 * 60 * 30,
  })

export const useBarrierSummary = () =>
  useQuery({
    queryKey: ['barrier-summary'],
    queryFn: async () => {
      const { data } = await barriersApi.summary()
      return data
    },
    staleTime: 1000 * 60 * 30,
  })
