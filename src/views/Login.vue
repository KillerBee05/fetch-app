<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
      <h1 class="text-black text-[32px] font-bold text-center mb-6">Login</h1>

      <form @submit.prevent="handleLogin">
        <div class="mb-6">
          <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
          <InputText
            id="name"
            v-model="name"
            placeholder="Enter first name"
            class="w-full mt-2"
            required
          />
        </div>

        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter email"
            class="w-full mt-2"
            required
          />
        </div>

        <div class="flex justify-center mt-8">
          <Button label="Login" type="submit" class="w-full" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useUserStore } from '@/stores/user-store'

const router = useRouter()
const userStore = useUserStore()
const name = ref('')
const email = ref('')
const errorMessage = ref('')



const handleLogin = async () => {
  if(!name.value || !email.value) {
    errorMessage.value = 'Please enter both name and email'
    return 
  }

  try {
    await userStore.login(name.value, email.value)
    router.push('/')
  } catch (error) {
    
  }
}
</script>