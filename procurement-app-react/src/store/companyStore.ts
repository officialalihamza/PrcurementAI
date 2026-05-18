import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CompanyStore {
  company: Record<string, unknown> | null
  setCompany: (data: Record<string, unknown>) => void
  clearCompany: () => void
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      company: null,
      setCompany: (data) => set({ company: data }),
      clearCompany: () => set({ company: null }),
    }),
    { name: 'company-profile' }
  )
)
