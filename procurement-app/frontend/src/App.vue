<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Authenticated app shell: sidebar + content -->
    <template v-if="showSidebar">
      <Sidebar />
      <div class="lg:ml-60 min-h-screen">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </template>

    <!-- Public pages (Home, Login, Signup): no sidebar -->
    <template v-else>
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Sidebar from '@/components/Sidebar.vue'

const route     = useRoute()
const userStore = useUserStore()

const showSidebar = computed(
  () => userStore.isAuthenticated && !!route.meta.requiresAuth
)

onMounted(async () => {
  await userStore.init()
})
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
