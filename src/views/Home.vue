<template>
  <div class="container mx-auto p-4">
    <h2 class="text-2xl font-bold mb-6">Dog Search</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <MultiSelect 
        v-model="selectedBreeds" 
        :options="dogStore.breeds" 
        placeholder="Filter Breed"
        class="w-full"
      />

      <InputNumber 
        v-model="ageMin" 
        placeholder="Min Age" 
        class="w-full"
      />
      <InputNumber 
        v-model="ageMax" 
        placeholder="Max Age" 
        class="w-full"
      />

      <ToggleButton
        v-model="sortAscending"
        onLabel="A-Z"
        offLabel="Z-A"
        class="w-full"
        @change="updateSort"
      />
    </div>

    <Button 
      label="Search" 
      @click="searchDogs" 
      class="w-full mb-6"
    />

    <DataView 
      v-if="dogStore.dogs.length" 
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
              <p>Zip Code: {{ dog.zip_code }}</p>
            </div>
          </div>
        </div>
      </template>
    </DataView>

    <div v-else class="text-center text-gray-500 mt-6">
      No dogs found. Try adjusting your search criteria.
    </div>

    <Paginator 
      v-if="dogStore.totalDogs > 0"
      :rows="25" 
      :totalRecords="dogStore.totalDogs"
      @page="onPageChange"
      class="mt-6"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDogStore } from '@/stores/dog-store'
import MultiSelect from 'primevue/multiselect'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import Paginator from 'primevue/paginator'

const dogStore = useDogStore()
const selectedBreeds = ref<string[]>([])
const ageMin = ref<number | null>(null)
const ageMax = ref<number | null>(null)
const sortOption = ref<string>('breed:asc')
const sortAscending = ref<boolean>(true)

onMounted(async () => {
  await dogStore.fetchBreeds()
  await searchDogs()
})

const searchDogs = async () => {
  await dogStore.searchDogs({
    breeds: selectedBreeds.value,
    ageMin: ageMin.value ?? undefined,
    ageMax: ageMax.value ?? undefined,
    sort: sortOption.value
  })
}

const updateSort = () => {
  sortOption.value = sortAscending.value ? 'breed:asc' : 'breed:desc'
  searchDogs()
}

const onPageChange = async (event: { page: number }) => {
  await dogStore.searchDogs({
    breeds: selectedBreeds.value,
    ageMin: ageMin.value ?? undefined,
    ageMax: ageMax.value ?? undefined,
    sort: sortOption.value,
    page: event.page + 1
  })
}
</script>