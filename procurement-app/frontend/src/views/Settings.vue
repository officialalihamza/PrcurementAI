<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

    <div class="space-y-8">
      <!-- Company profile -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Company Profile</h2>
        <p class="text-sm text-gray-500 mb-6">Update your company details to improve contract matching accuracy.</p>
        <CompanyProfile submit-label="Save changes" @saved="profileSaved" />
      </div>

      <!-- Alerts section -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Contract Alerts</h2>
        <p class="text-sm text-gray-500 mb-6">Manage your saved alerts and notification preferences.</p>
        <AlertsManager />
      </div>

      <!-- Account section -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Account</h2>
        <p class="text-sm text-gray-500 mb-6">Manage your account settings.</p>

        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium text-gray-700">Email address</p>
            <p class="text-sm text-gray-500 mt-0.5">{{ userStore.userEmail }}</p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-700 mb-3">Danger zone</p>
            <button @click="handleSignOut" class="btn-danger text-sm">
              Sign out of all devices
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success toast -->
    <Transition name="slide-up">
      <div v-if="toastMsg" class="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import CompanyProfile from '@/components/CompanyProfile.vue'
import AlertsManager from '@/components/AlertsManager.vue'

const userStore = useUserStore()
const router = useRouter()
const toastMsg = ref('')

function showToast(msg) {
  toastMsg.value = msg
  setTimeout(() => { toastMsg.value = '' }, 3000)
}

function profileSaved() {
  showToast('Company profile updated successfully')
}

async function handleSignOut() {
  await userStore.logout()
  router.push('/')
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
