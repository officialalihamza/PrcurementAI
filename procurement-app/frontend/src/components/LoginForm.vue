<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="label">Email address</label>
      <input v-model="email" type="email" required autocomplete="email" class="input" placeholder="you@company.com" />
    </div>
    <div>
      <label class="label">Password</label>
      <input v-model="password" type="password" required autocomplete="current-password" class="input" placeholder="••••••••" />
    </div>

    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <button type="submit" :disabled="loading" class="btn-primary w-full">
      <span v-if="loading" class="flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        Signing in…
      </span>
      <span v-else>Sign in</span>
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signIn } from '@/lib/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
    await userStore.init()
    const redirect = route.query.redirect || (userStore.hasCompany ? '/dashboard' : '/onboarding')
    router.push(redirect)
  } catch (e) {
    error.value = e.message || 'Invalid email or password'
  } finally {
    loading.value = false
  }
}
</script>
