import { create } from 'zustand'
import type { Contract } from '../types'

interface Filters {
  q: string
  sector: string
  region: string
  sme_flag: string
  status: string
  min_value: string
  max_value: string
  page: number
}

interface ContractState {
  filters: Filters
  selectedContract: Contract | null
  setFilter: (key: keyof Filters, value: string | number) => void
  applyFilters: (draft: Partial<Filters>) => void
  resetFilters: () => void
  selectContract: (c: Contract | null) => void
}

const defaults: Filters = {
  q: '', sector: '', region: '', sme_flag: '', status: 'active',
  min_value: '', max_value: '', page: 1,
}

export const useContractStore = create<ContractState>((set) => ({
  filters: defaults,
  selectedContract: null,
  setFilter: (key, value) =>
    set((s) => ({
      filters: {
        ...s.filters,
        [key]: value,
        page: key === 'page' ? Number(value) : 1,
      },
    })),
  applyFilters: (draft) =>
    set((s) => ({ filters: { ...s.filters, ...draft, page: 1 } })),
  resetFilters: () => set({ filters: defaults }),
  selectContract: (c) => set({ selectedContract: c }),
}))
