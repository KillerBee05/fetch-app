<template>
  <div class="container mx-auto p-4">
    <h2 class="text-2xl font-bold mb-6">Dog Search</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          @change="handleCityChange"
        />
        <Button 
          v-if="selectedCity" 
          icon="pi pi-times" 
          class="p-button-text absolute right-8 top-1/2 transform -translate-y-1/2"
          @click="clearCity"
        />
      </div>
    </div>

    <div class="border rounded-lg p-4 mb-6 bg-gray-50">
      <h3 class="text-lg font-semibold mb-4">Additional Filters</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div class="flex justify-end md:col-span-2">
          <Button 
            label="Apply Filters" 
            icon="pi pi-filter"
            @click="applyFilters"
            class="p-button-primary"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-4 mb-6 items-center">
      <span class="font-medium">Sort by:</span>
      <div class="flex gap-2">
        <Button 
          :label="getSortLabel('name')"
          :class="{ 'p-button-outlined': sortField !== 'name' }"
          @click="handleSort('name')"
        />
        <Button 
          :label="getSortLabel('breed')"
          :class="{ 'p-button-outlined': sortField !== 'breed' }"
          @click="handleSort('breed')"
        />
        <Button 
          :label="getSortLabel('age')"
          :class="{ 'p-button-outlined': sortField !== 'age' }"
          @click="handleSort('age')"
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
import { ref, onMounted, computed } from 'vue'
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
const sortField = ref<'name' | 'breed' | 'age' | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')

const availableStates = computed(() => locationStore.getAvailableStates)
const availableCities = computed(() => locationStore.getAvailableCitiesForState)

const getSortLabel = (field: 'name' | 'breed' | 'age') => {
  if (sortField.value !== field) return field.charAt(0).toUpperCase() + field.slice(1)
  return `${field.charAt(0).toUpperCase() + field.slice(1)} ${sortOrder.value === 'asc' ? '↑' : '↓'}`
}

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
  locationStore.selectedState = ''
  fetchDogs()
}

const clearCity = () => {
  selectedCity.value = null
  fetchDogs()
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
    locationStore.selectedState = selectedState.value
    fetchDogs()
  }
}

const handleCityChange = () => {
  fetchDogs()
}

const handleSort = (field: 'name' | 'breed' | 'age') => {
  console.log('Sort clicked:', { field, currentSort: sortField.value, currentOrder: sortOrder.value })
  if (sortField.value === field) {
    if (sortOrder.value === 'desc') {
      sortField.value = null
      sortOrder.value = 'asc'
    } else {
      sortOrder.value = 'desc'
    }
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }

  fetchDogs()
}

const fetchDogs = async (page?: number) => {
  isLoading.value = true
  try {
    console.log('Fetching dogs with params:', {
      breed: selectedBreed.value,
      state: selectedState.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value
    })
    const results = await dogStore.searchDogs({
      breeds: selectedBreed.value ? [selectedBreed.value] : undefined,
      ageMin: ageMin.value ?? undefined,
      ageMax: ageMax.value ?? undefined,
      state: selectedState.value ?? undefined,
      city: selectedCity.value ?? undefined,
      page: page ? page + 1 : 1,
      size: 20,
      sortField: sortField.value ?? undefined,
      sortOrder: sortOrder.value
    })
    
    dogStore.dogs = results.dogs
    noResults.value = results.noResults

  } catch (error) {
    console.error('Error fetching dogs:', error)
    noResults.value = true
    dogStore.dogs = []
  } finally {
    isLoading.value = false
  }
}

const applyFilters = () => {
  fetchDogs()
}

onMounted(async () => {
  await dogStore.fetchBreeds()
  await fetchDogs()
})
</script>