<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Set up your company profile</h1>
        <p class="text-gray-500 mt-2 max-w-sm mx-auto">
          We use this to calculate how well each contract matches your business.
        </p>
      </div>

      <!-- Progress -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
          <span class="text-sm font-medium text-gray-700">Account</span>
        </div>
        <div class="h-px w-8 bg-brand-400"></div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">2</div>
          <span class="text-sm font-medium text-brand-700">Company</span>
        </div>
        <div class="h-px w-8 bg-gray-300"></div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
          <span class="text-sm text-gray-400">Dashboard</span>
        </div>
      </div>

      <div class="card p-8">
        <CompanyProfile submit-label="Complete setup" @saved="handleSaved" />

        <button @click="skip" class="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full text-center">
          Skip for now →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import CompanyProfile from '@/components/CompanyProfile.vue'

const router = useRouter()

function handleSaved() {
  router.push('/dashboard')
}

function skip() {
  router.push('/dashboard')
}
</script>
