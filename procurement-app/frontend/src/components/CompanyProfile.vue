<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="label">Company name *</label>
        <input v-model="form.name" type="text" required class="input" placeholder="Acme Ltd" />
      </div>
      <div>
        <label class="label">Companies House number</label>
        <input v-model="form.company_number" type="text" class="input" placeholder="12345678" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="label">Postcode</label>
        <input v-model="form.postcode" type="text" class="input" placeholder="SW1A 1AA" />
      </div>
      <div>
        <label class="label">Region</label>
        <select v-model="form.region" class="input">
          <option value="">Select region…</option>
          <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
    </div>

    <div>
      <label class="label">SIC codes (comma-separated)</label>
      <input
        v-model="sicInput"
        type="text"
        class="input"
        placeholder="e.g. 62020, 62090, 63110"
      />
      <p class="text-xs text-gray-500 mt-1">Enter your SIC codes to improve contract matching</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="label">Number of employees</label>
        <input v-model.number="form.employees" type="number" min="1" class="input" placeholder="50" />
      </div>
      <div>
        <label class="label">Annual turnover (£)</label>
        <input v-model.number="form.turnover" type="number" min="0" class="input" placeholder="500000" />
      </div>
    </div>

    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>
    <div v-if="success" class="p-3 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-sm text-green-700">Profile saved successfully.</p>
    </div>

    <div class="flex justify-end">
      <button type="submit" :disabled="loading" class="btn-primary">
        <span v-if="loading">Saving…</span>
        <span v-else>{{ submitLabel }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { companyApi } from '@/lib/api'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  submitLabel: { type: String, default: 'Save profile' },
  existingData: { type: Object, default: null },
})
const emit = defineEmits(['saved'])

const userStore = useUserStore()

const regions = [
  'East Midlands', 'East of England', 'London', 'North East',
  'North West', 'Northern Ireland', 'Scotland', 'South East',
  'South West', 'Wales', 'West Midlands', 'Yorkshire and the Humber',
]

const form = ref({
  name: '',
  company_number: '',
  postcode: '',
  region: '',
  employees: null,
  turnover: null,
})
const sicInput = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

onMounted(() => {
  const data = props.existingData || userStore.company
  if (data) {
    form.value = {
      name: data.name || '',
      company_number: data.company_number || '',
      postcode: data.postcode || '',
      region: data.region || '',
      employees: data.employees || null,
      turnover: data.turnover || null,
    }
    sicInput.value = (data.sic_codes || []).join(', ')
  }
})

async function handleSubmit() {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    const sic_codes = sicInput.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = { ...form.value, sic_codes }
    const res = await companyApi.upsert(payload)
    await userStore.fetchCompany()
    success.value = true
    emit('saved', userStore.company)
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to save profile'
  } finally {
    loading.value = false
  }
}
</script>
