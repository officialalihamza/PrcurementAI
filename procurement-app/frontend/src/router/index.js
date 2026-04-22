import { createRouter, createWebHistory } from 'vue-router'
import { getSession } from '@/lib/auth'

const routes = [
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue'), meta: { public: true } },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { public: true, guestOnly: true } },
  { path: '/signup', name: 'Signup', component: () => import('@/views/Signup.vue'), meta: { public: true, guestOnly: true } },
  { path: '/onboarding', name: 'Onboarding', component: () => import('@/views/Onboarding.vue'), meta: { requiresAuth: true } },
  { path: '/dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/contracts', name: 'Contracts', component: () => import('@/views/Contracts.vue'), meta: { requiresAuth: true } },
  { path: '/analytics', name: 'Analytics', component: () => import('@/views/Analytics.vue'), meta: { requiresAuth: true } },
  { path: '/settings', name: 'Settings', component: () => import('@/views/Settings.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const session = await getSession()

  if (to.meta.requiresAuth && !session) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && session) {
    return { name: 'Dashboard' }
  }

  return true
})

export default router
