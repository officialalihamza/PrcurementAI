import { useQuery } from '@tanstack/react-query'
import { dashboardApi, statsApi, barriersApi } from '../services/api'

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await dashboardApi.getStats()
      return data
    },
    staleTime: 1000 * 60 * 5,
  })

export const useHypothesisTests = () =>
  useQuery({
    queryKey: ['hypothesis-tests'],
    queryFn: async () => {
      const { data } = await statsApi.hypothesisTests()
      return data.tests || []
    },
    staleTime: 1000 * 60 * 30,
  })

export const useSectorModels = () =>
  useQuery({
    queryKey: ['sector-models'],
    queryFn: async () => {
      const { data } = await statsApi.sectorModels()
      return data.models || []
    },
    staleTime: 1000 * 60 * 30,
  })

export const useRegionalCompetitiveness = () =>
  useQuery({
    queryKey: ['regional-competitiveness'],
    queryFn: async () => {
      const { data } = await statsApi.regionalCompetitiveness()
      return data.regions || []
    },
    staleTime: 1000 * 60 * 30,
  })

export const useAnomalies = () =>
  useQuery({
    queryKey: ['anomalies'],
    queryFn: async () => {
      const { data } = await statsApi.anomalies()
      return data.anomalies || data || []
    },
    staleTime: 1000 * 60 * 30,
  })

export const useAnalyticsStats = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['analytics-stats', params],
    queryFn: async () => {
      const { analyticsApi } = await import('../services/api')
      const { data } = await analyticsApi.getStats(params)
      return data
    },
    staleTime: 1000 * 60 * 10,
  })
