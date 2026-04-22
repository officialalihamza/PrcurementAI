import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSession, signOut, onAuthStateChange } from '@/lib/auth'
import { companyApi } from '@/lib/api'

export const useUserStore = defineStore('user', () => {
  const session = ref(null)
  const company = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!session.value)
  const userId = computed(() => session.value?.user?.id)
  const userEmail = computed(() => session.value?.user?.email)
  const hasCompany = computed(() => !!company.value)

  async function init() {
    const s = await getSession()
    session.value = s
    if (s) await fetchCompany()

    onAuthStateChange((event, s) => {
      session.value = s
      if (s) fetchCompany()
      else company.value = null
    })
  }

  async function fetchCompany() {
    try {
      const res = await companyApi.get()
      company.value = res.data.company
    } catch {
      company.value = null
    }
  }

  async function logout() {
    await signOut()
    session.value = null
    company.value = null
  }

  function setCompany(data) {
    company.value = data
  }

  return { session, company, loading, isAuthenticated, userId, userEmail, hasCompany, init, fetchCompany, logout, setCompany }
})
