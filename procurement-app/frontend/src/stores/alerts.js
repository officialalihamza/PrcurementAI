import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alertsApi } from '@/lib/api'

export const useAlertsStore = defineStore('alerts', () => {
  const alerts = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchAlerts() {
    loading.value = true
    error.value = null
    try {
      const res = await alertsApi.list()
      alerts.value = res.data.alerts || []
    } catch (e) {
      error.value = e.response?.data?.detail || 'Failed to load alerts'
    } finally {
      loading.value = false
    }
  }

  async function createAlert(data) {
    const res = await alertsApi.create(data)
    await fetchAlerts()
    return res.data
  }

  async function updateAlert(id, data) {
    await alertsApi.update(id, data)
    await fetchAlerts()
  }

  async function deleteAlert(id) {
    await alertsApi.delete(id)
    alerts.value = alerts.value.filter(a => a.id !== id)
  }

  async function toggleAlert(id, active) {
    await alertsApi.update(id, { active })
    const alert = alerts.value.find(a => a.id === id)
    if (alert) alert.active = active
  }

  async function getHistory(id) {
    const res = await alertsApi.getHistory(id)
    return res.data.history || []
  }

  return { alerts, loading, error, fetchAlerts, createAlert, updateAlert, deleteAlert, toggleAlert, getHistory }
})
