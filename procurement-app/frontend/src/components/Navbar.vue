<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
      <div class="flex items-center gap-8">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span class="font-bold text-lg text-gray-900">ProcurementAI</span>
        </RouterLink>

        <div v-if="isAuthenticated" class="hidden md:flex items-center gap-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(link.to) ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <template v-if="isAuthenticated">
          <span class="hidden md:block text-sm text-gray-500">{{ userEmail }}</span>
          <RouterLink to="/settings" class="btn-secondary text-sm py-1.5">
            Settings
          </RouterLink>
          <button @click="handleLogout" class="btn-secondary text-sm py-1.5">
            Sign out
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn-secondary text-sm py-1.5">Log in</RouterLink>
          <RouterLink to="/signup" class="btn-primary text-sm py-1.5">Sign up free</RouterLink>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isAuthenticated = computed(() => userStore.isAuthenticated)
const userEmail = computed(() => userStore.userEmail)

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/contracts', label: 'Contracts' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Alerts' },
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

async function handleLogout() {
  await userStore.logout()
  router.push('/')
}
</script>
