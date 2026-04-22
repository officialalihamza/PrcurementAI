<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div>
      <label class="label">Email address</label>
      <input v-model="email" type="email" required autocomplete="email" class="input" placeholder="you@company.com" />
    </div>
    <div>
      <label class="label">Password</label>
      <input v-model="password" type="password" required minlength="8" autocomplete="new-password" class="input" placeholder="Min. 8 characters" />
    </div>
    <div>
      <label class="label">Confirm password</label>
      <input v-model="confirmPassword" type="password" required autocomplete="new-password" class="input" placeholder="••••••••" />
    </div>

    <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p class="text-sm text-red-700">{{ error }}</p>
    </div>

    <div v-if="success" class="p-3 bg-green-50 border border-green-200 rounded-lg">
      <p class="text-sm text-green-700">Account created! Check your email to confirm, then sign in.</p>
    </div>

    <button type="submit" :disabled="loading || success" class="btn-primary w-full">
      <span v-if="loading" class="flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        Creating account…
      </span>
      <span v-else>Create free account</span>
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signUp, signIn } from '@/lib/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  loading.value = true
  try {
    const data = await signUp(email.value, password.value)
    if (data?.session) {
      await userStore.init()
      router.push('/onboarding')
    } else {
      success.value = true
    }
  } catch (e) {
    error.value = e.message || 'Signup failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
