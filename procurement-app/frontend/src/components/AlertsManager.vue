<template>
  <div class="space-y-6">
    <!-- Create alert -->
    <div class="card p-6">
      <h3 class="font-semibold text-gray-900 mb-4">{{ editing ? 'Edit Alert' : 'Create New Alert' }}</h3>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Alert name *</label>
            <input v-model="form.name" type="text" required class="input" placeholder="e.g. IT contracts London" />
          </div>
          <div>
            <label class="label">Frequency</label>
            <select v-model="form.frequency" class="input">
              <option value="instant">Instant (as published)</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="label">Min value (£)</label>
            <input v-model.number="form.filters.value_min" type="number" min="0" class="input" placeholder="0" />
          </div>
          <div>
            <label class="label">Max value (£)</label>
            <input v-model.number="form.filters.value_max" type="number" min="0" class="input" placeholder="10000000" />
          </div>
          <div>
            <label class="label">SME filter</label>
            <select v-model="form.filters.sme_only" class="input">
              <option :value="false">All contracts</option>
              <option :value="true">SME suitable only</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Keyword</label>
            <input v-model="form.filters.keyword" type="text" class="input" placeholder="e.g. cloud software" />
          </div>
          <div>
            <label class="label">Regions (comma-separated)</label>
            <input v-model="regionsInput" type="text" class="input" placeholder="London, South East" />
          </div>
        </div>

        <div v-if="formError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {{ formError }}
        </div>

        <div class="flex gap-3">
          <button type="submit" :disabled="saving" class="btn-primary">
            {{ saving ? 'Saving…' : editing ? 'Update alert' : 'Create alert' }}
          </button>
          <button v-if="editing" type="button" @click="cancelEdit" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>

    <!-- Alerts list -->
    <div>
      <h3 class="font-semibold text-gray-900 mb-3">Your alerts ({{ alertsStore.alerts.length }})</h3>

      <div v-if="alertsStore.loading" class="text-center py-8 text-gray-400">Loading…</div>

      <div v-else-if="!alertsStore.alerts.length" class="card p-8 text-center text-gray-500">
        <p>No alerts yet. Create one above to get notified about new contracts.</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="alert in alertsStore.alerts" :key="alert.id" class="card p-4">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-medium text-gray-900 truncate">{{ alert.name }}</h4>
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="alert.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                >
                  {{ alert.active ? 'Active' : 'Paused' }}
                </span>
                <span class="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  {{ alert.frequency }}
                </span>
              </div>
              <p class="text-sm text-gray-500">
                <span v-if="alert.filters?.keyword">Keyword: "{{ alert.filters.keyword }}" · </span>
                <span v-if="alert.filters?.value_min || alert.filters?.value_max">
                  £{{ (alert.filters.value_min || 0).toLocaleString() }} – £{{ (alert.filters.value_max || 10000000).toLocaleString() }} ·
                </span>
                <span v-if="alert.filters?.sme_only">SME only · </span>
                <span v-if="alert.filters?.regions?.length">{{ alert.filters.regions.join(', ') }}</span>
              </p>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <button @click="viewHistory(alert)" class="btn-secondary text-xs py-1 px-2">History</button>
              <button @click="startEdit(alert)" class="btn-secondary text-xs py-1 px-2">Edit</button>
              <button @click="alertsStore.toggleAlert(alert.id, !alert.active)" class="btn-secondary text-xs py-1 px-2">
                {{ alert.active ? 'Pause' : 'Resume' }}
              </button>
              <button @click="confirmDelete(alert.id)" class="btn-danger text-xs py-1 px-2">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- History modal -->
    <Teleport to="body">
      <div v-if="historyAlert" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" @click.self="historyAlert = null">
        <div class="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-gray-900">History: {{ historyAlert.name }}</h3>
              <button @click="historyAlert = null" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div v-if="historyLoading" class="text-center py-8 text-gray-400">Loading…</div>
            <div v-else-if="!historyItems.length" class="text-center py-8 text-gray-500">No history yet</div>
            <div v-else class="space-y-4">
              <div v-for="h in historyItems" :key="h.id" class="border border-gray-100 rounded-lg p-3">
                <p class="text-xs text-gray-500 mb-2">{{ new Date(h.sent_at).toLocaleString('en-GB') }} · {{ h.contracts?.length || 0 }} contracts</p>
                <ul class="space-y-1">
                  <li v-for="c in (h.contracts || []).slice(0, 3)" :key="c.ocid" class="text-sm text-gray-700">
                    {{ c.title }} — <span class="text-gray-500">{{ c.buyer }}</span>
                  </li>
                  <li v-if="(h.contracts || []).length > 3" class="text-xs text-gray-400">
                    +{{ h.contracts.length - 3 }} more
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAlertsStore } from '@/stores/alerts'

const alertsStore = useAlertsStore()

const defaultForm = () => ({
  name: '',
  frequency: 'daily',
  filters: { keyword: '', value_min: 0, value_max: 10000000, sme_only: false, regions: [], cpv: [] },
})

const form = ref(defaultForm())
const regionsInput = ref('')
const saving = ref(false)
const formError = ref('')
const editing = ref(null)

const historyAlert = ref(null)
const historyItems = ref([])
const historyLoading = ref(false)

onMounted(() => alertsStore.fetchAlerts())

async function handleSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const payload = {
      ...form.value,
      filters: {
        ...form.value.filters,
        regions: regionsInput.value.split(',').map(r => r.trim()).filter(Boolean),
      },
    }
    if (editing.value) {
      await alertsStore.updateAlert(editing.value, payload)
    } else {
      await alertsStore.createAlert(payload)
    }
    cancelEdit()
  } catch (e) {
    formError.value = e.response?.data?.detail || 'Failed to save alert'
  } finally {
    saving.value = false
  }
}

function startEdit(alert) {
  editing.value = alert.id
  form.value = {
    name: alert.name,
    frequency: alert.frequency,
    filters: { ...{ keyword: '', value_min: 0, value_max: 10000000, sme_only: false, regions: [], cpv: [] }, ...alert.filters },
  }
  regionsInput.value = (alert.filters?.regions || []).join(', ')
}

function cancelEdit() {
  editing.value = null
  form.value = defaultForm()
  regionsInput.value = ''
  formError.value = ''
}

async function confirmDelete(id) {
  if (confirm('Delete this alert?')) {
    await alertsStore.deleteAlert(id)
  }
}

async function viewHistory(alert) {
  historyAlert.value = alert
  historyLoading.value = true
  historyItems.value = []
  try {
    historyItems.value = await alertsStore.getHistory(alert.id)
  } finally {
    historyLoading.value = false
  }
}
</script>
