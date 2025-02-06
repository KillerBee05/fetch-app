<template>
  <div class="container mx-auto p-4">
    <h1 class="text-black text-[32px] mb-6">Home</h1>
    
    <Button 
      label="Fetch Dogs" 
      @click="handleFetchDogs"
      class="w-full max-w-xs"
    />
    
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDogStore } from '@/stores/dog-store'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const router = useRouter()
const dogStore = useDogStore()
const toast = useToast()

const dogs = ref<[]>([])

const handleFetchDogs = async () => {
  try {
    dogs.value = await dogStore.fetchDogs()
    toast.add({ 
      severity: 'success', 
      summary: 'Dogs Fetched', 
      detail: 'Successfully retrieved dog breeds', 
      life: 3000 
    })
  } catch (error: any) {
    toast.add({ 
      severity: 'error', 
      summary: 'Fetch Failed', 
      detail: 'Unable to fetch dog breeds', 
      life: 3000 
    })
  }
}
</script>