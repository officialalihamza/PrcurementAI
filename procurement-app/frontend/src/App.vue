<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar v-if="showNav" />
    <main :class="showNav ? 'pt-16' : ''">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Navbar from '@/components/Navbar.vue'

const route = useRoute()
const userStore = useUserStore()

const showNav = computed(() => !route.meta.public || userStore.isAuthenticated)

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
