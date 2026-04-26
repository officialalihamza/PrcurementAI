<template>
  <!-- Mobile overlay -->
  <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-black/50 lg:hidden" @click="mobileOpen = false" />

  <!-- Mobile toggle -->
  <button
    @click="mobileOpen = !mobileOpen"
    class="fixed top-4 left-4 z-50 lg:hidden w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg"
  >
    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path v-if="mobileOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
    </svg>
  </button>

  <!-- Sidebar -->
  <aside
    class="fixed top-0 left-0 h-full w-60 bg-slate-900 flex flex-col z-40 transition-transform duration-200"
    :class="mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
  >
    <!-- Logo -->
    <div class="px-5 py-5 border-b border-slate-700/50">
      <RouterLink to="/dashboard" class="flex items-center gap-3" @click="mobileOpen = false">
        <div class="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <span class="font-bold text-white text-base leading-tight">ProcurementAI</span>
      </RouterLink>
    </div>

    <!-- Nav links -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

      <!-- Dashboard -->
      <RouterLink to="/dashboard" @click="mobileOpen = false"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
        :class="isActive('/dashboard') ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'">
        <svg class="w-5 h-5 flex-shrink-0" :class="isActive('/dashboard') ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
        </svg>
        Dashboard
      </RouterLink>

      <!-- Contracts -->
      <RouterLink to="/contracts" @click="mobileOpen = false"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
        :class="isActive('/contracts') ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'">
        <svg class="w-5 h-5 flex-shrink-0" :class="isActive('/contracts') ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        Contracts
      </RouterLink>

      <!-- Analytics -->
      <RouterLink to="/analytics" @click="mobileOpen = false"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
        :class="isActive('/analytics') ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'">
        <svg class="w-5 h-5 flex-shrink-0" :class="isActive('/analytics') ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        Analytics
      </RouterLink>

      <!-- Section label -->
      <div class="pt-4 pb-1">
        <p class="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Account</p>
      </div>

      <!-- Alerts & Settings -->
      <RouterLink to="/settings" @click="mobileOpen = false"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
        :class="isActive('/settings') ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'">
        <svg class="w-5 h-5 flex-shrink-0" :class="isActive('/settings') ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        Alerts &amp; Settings
      </RouterLink>

    </nav>

    <!-- User footer -->
    <div class="px-3 py-4 border-t border-slate-700/50 space-y-1">
      <div class="px-3 py-2">
        <p class="text-xs text-slate-500 truncate">Signed in as</p>
        <p class="text-xs font-medium text-slate-300 truncate">{{ userEmail }}</p>
      </div>
      <button @click="handleLogout"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 group">
        <svg class="w-5 h-5 flex-shrink-0 text-slate-500 group-hover:text-slate-300"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Sign out
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route     = useRoute()
const router    = useRouter()
const userStore = useUserStore()

const mobileOpen = ref(false)
const userEmail  = computed(() => userStore.userEmail)

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

async function handleLogout() {
  await userStore.logout()
  router.push('/')
}
</script>
