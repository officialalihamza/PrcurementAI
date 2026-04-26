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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <span class="font-bold text-white text-base leading-tight">ProcurementAI</span>
      </RouterLink>
    </div>

    <!-- Nav links -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        @click="mobileOpen = false"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
        :class="isActive(link.to)
          ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'"
      >
        <component :is="link.icon" class="w-4.5 h-4.5 flex-shrink-0" :class="isActive(link.to) ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'" />
        {{ link.label }}
        <span v-if="link.badge" class="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-brand-600/30 text-brand-300">{{ link.badge }}</span>
      </RouterLink>

      <!-- Divider -->
      <div class="pt-4 pb-1">
        <p class="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Settings</p>
      </div>

      <RouterLink
        to="/settings"
        @click="mobileOpen = false"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group"
        :class="isActive('/settings')
          ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'"
      >
        <IconSettings class="w-4.5 h-4.5 flex-shrink-0" :class="isActive('/settings') ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'" />
        Alerts & Settings
      </RouterLink>
    </nav>

    <!-- User footer -->
    <div class="px-3 py-4 border-t border-slate-700/50 space-y-1">
      <div class="px-3 py-2">
        <p class="text-xs text-slate-500 truncate">Signed in as</p>
        <p class="text-xs font-medium text-slate-300 truncate">{{ userEmail }}</p>
      </div>
      <button
        @click="handleLogout"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 group"
      >
        <svg class="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        Sign out
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, defineComponent, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route  = useRoute()
const router = useRouter()
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

// ── Inline SVG icon components ─────────────────────────────────────────────
const IconDashboard = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' }),
  ]),
})

const IconContracts = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }),
  ]),
})

const IconAnalytics = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }),
  ]),
})

const IconSettings = defineComponent({
  render: () => h('svg', { fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' }),
  ]),
})

const navLinks = [
  { to: '/dashboard',  label: 'Dashboard',  icon: IconDashboard },
  { to: '/contracts',  label: 'Contracts',  icon: IconContracts },
  { to: '/analytics',  label: 'Analytics',  icon: IconAnalytics },
]
</script>
