<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useUserStore } from '@/stores/user-store'
import Button from 'primevue/button'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const showNav = computed(() => route.name !== 'login')

const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed', error)
  }
}
</script>

<template>
  <nav v-if="showNav" class="p-4 flex items-center justify-between border-b border-gray-200">
    <div class="flex space-x-6 items-center">
      <RouterLink to="/" class="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
        <i class="pi pi-home"></i>
        <span>Home</span>
      </RouterLink>
      <RouterLink to="/match" class="flex items-center gap-2 ml-10 text-gray-700 hover:text-blue-600 transition-colors">
        <i class="pi pi-heart"></i>
        <span>Match</span>
      </RouterLink>
    </div>
    <div class="flex items-center">
      <Button 
        severity="secondary"
        text
        rounded
        @click="handleLogout"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-sign-out"></i>
          <span>Logout</span>
        </div>
      </Button>
    </div>
  </nav>
  
  <RouterView />
</template>