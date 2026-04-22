<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Welcome banner -->
    <div class="mb-8 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome back{{ userStore.company?.name ? ', ' + userStore.company.name : '' }}
        </h1>
        <p class="text-gray-500 mt-1">Here's your procurement overview</p>
      </div>
      <div class="flex gap-3">
        <RouterLink to="/contracts" class="btn-primary">Search contracts</RouterLink>
        <RouterLink to="/analytics" class="btn-secondary">View analytics</RouterLink>
      </div>
    </div>

    <!-- Onboarding nudge -->
    <div v-if="!userStore.hasCompany" class="card p-5 border-brand-200 bg-brand-50 mb-6 flex items-center justify-between gap-4">
      <div>
        <p class="font-medium text-brand-800">Complete your company profile</p>
        <p class="text-sm text-brand-600 mt-0.5">Add your SIC codes and region to see personalised match scores on contracts.</p>
      </div>
      <RouterLink to="/onboarding" class="btn-primary flex-shrink-0">Set up now</RouterLink>
    </div>

    <DashboardComponent />
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import DashboardComponent from '@/components/Dashboard.vue'

const userStore = useUserStore()
</script>
