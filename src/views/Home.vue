<template>
  <div class="container mx-auto p-4">
    <h2 class="text-2xl font-bold mb-6">Dog Search</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
      <div class="relative">
        <Dropdown 
          v-model="selectedBreed" 
          :options="dogStore.breeds" 
          placeholder="Select Breed"
          class="w-full"
        />
        <Button 
          v-if="selectedBreed" 
          icon="pi pi-times" 
          class="p-button-text absolute right-8 top-1/2 transform -translate-y-1/2"
          @click="clearBreed"
        />
      </div>
      <div class="relative">
        <Dropdown 
          v-model="selectedState" 
          :options="availableStates" 
          optionLabel="name"
          optionValue="abbreviation"
          placeholder="Select State (Optional)"
          class="w-full"
          @change="handleStateChange"
        />
        <Button 
          v-if="selectedState" 
          icon="pi pi-times" 
          class="p-button-text absolute right-8 top-1/2 transform -translate-y-1/2"
          @click="clearState"
        />
      </div>
      <div class="relative">
        <Dropdown
          v-model="selectedCity"
          :options="availableCities"
          placeholder="Select City (Optional)"
          class="w-full"
          :disabled="!selectedState"
        />
        <Button 
          v-if="selectedCity" 
          icon="pi pi-times" 
          class="p-button-text absolute right-8 top-1/2 transform -translate-y-1/2"
          @click="clearCity"
        />
      </div>
      <div class="flex items-center space-x-2">
        <InputNumber 
          v-model="ageMin" 
          placeholder="Min Age" 
          class="w-full"
        />
        <Button 
          v-if="ageMin !== null" 
          icon="pi pi-times" 
          class="p-button-text"
          @click="clearMinAge"
        />
      </div>
      <div class="flex items-center space-x-2">
        <InputNumber 
          v-model="ageMax" 
          placeholder="Max Age" 
          class="w-full"
        />
        <Button 
          v-if="ageMax !== null" 
          icon="pi pi-times" 
          class="p-button-text"
          @click="clearMaxAge"
        />
      </div>
    </div>
    
    <div v-if="isLoading" class="text-center text-gray-500 mt-6">
      <ProgressSpinner />
      <p class="mt-2">Loading dogs...</p>
    </div>

    <DataView 
      v-else-if="!noResults && dogStore.dogs.length" 
      :value="dogStore.dogs"
      dataKey="id"
      layout="grid"
    >
      <template #grid>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div 
            v-for="dog in dogStore.dogs" 
            :key="dog.id" 
            class="border rounded-lg p-4 shadow-md"
          >
            <img 
              :src="dog.img" 
              :alt="dog.name" 
              class="w-full h-48 object-cover rounded-lg mb-4"
            />
            <div class="space-y-2">
              <h3 class="text-xl font-bold">{{ dog.name }}</h3>
              <p>Breed: {{ dog.breed }}</p>
              <p>Age: {{ dog.age }} years</p>
              <p>Location: {{ dog.city }}, {{ dog.state }}, <br> {{ dog.zip_code }}</p>
            </div>
          </div>
        </div>
      </template>
    </DataView>

    <div v-else class="text-center text-gray-500 mt-6">
      <p>
        {{ getNoResultsMessage() }}
      </p>
    </div>

    <Paginator 
      v-if="dogStore.totalDogs > 0"
      :rows="25" 
      :totalRecords="dogStore.totalDogs"
      @page="event => fetchDogs(event.page)"
      class="mt-6"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useDogStore } from '@/stores/dog-store'
import { useLocationStore } from '@/stores/location-store'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import Paginator from 'primevue/paginator'
import ProgressSpinner from 'primevue/progressspinner'

const dogStore = useDogStore()
const locationStore = useLocationStore()

const selectedBreed = ref<string | null>(null)
const selectedState = ref<string | null>(null)
const selectedCity = ref<string | null>(null)
const ageMin = ref<number | null>(null)
const ageMax = ref<number | null>(null)
const isLoading = ref(false)
const noResults = ref(false)

const availableStates = computed(() => locationStore.getAvailableStates)
const availableCities = ref<string[]>([])

const getNoResultsMessage = () => {
  if (selectedCity.value) {
    return `No dogs found in ${selectedCity.value}, ${selectedState.value}`
  }
  if (selectedState.value) {
    return `No dogs found in ${selectedState.value}`
  }
  if (selectedBreed.value) {
    return `No ${selectedBreed.value} dogs found`
  }
  return 'No dogs found matching your criteria'
}

const clearBreed = () => {
  selectedBreed.value = null
}

const clearState = () => {
  selectedState.value = null
  selectedCity.value = null
  availableCities.value = []
}

const clearCity = () => {
  selectedCity.value = null
}

const clearMinAge = () => {
  ageMin.value = null
}

const clearMaxAge = () => {
  ageMax.value = null
}

const handleStateChange = async () => {
  selectedCity.value = null
  if (selectedState.value) {
    availableCities.value = await locationStore.getAvailableCitiesForState(selectedState.value)
  } else {
    availableCities.value = []
  }
}

const fetchDogs = async (page?: number) => {
  isLoading.value = true
  try {
    const results = await dogStore.searchDogs({
      breeds: selectedBreed.value ? [selectedBreed.value] : undefined,
      ageMin: ageMin.value ?? undefined,
      ageMax: ageMax.value ?? undefined,
      state: selectedState.value ?? undefined,
      city: selectedCity.value ?? undefined,
      page: page ? page + 1 : 1,
      size: 25
    })
    
    dogStore.dogs = results.noResults ? [] : dogStore.dogs
    noResults.value = results.noResults
  } catch (error) {
    console.error('Error fetching dogs:', error)
    noResults.value = true
    dogStore.dogs = []
  } finally {
    isLoading.value = false
  }
}

watch(
  [selectedBreed, selectedState, selectedCity, ageMin, ageMax],
  async () => {
    await fetchDogs()
  }
)

onMounted(async () => {
  await dogStore.fetchBreeds()
  await fetchDogs()
})
</script>