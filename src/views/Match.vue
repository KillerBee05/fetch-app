<template>
  <div class="container mx-auto p-4">
    <div v-if="!showMatch && userStore.favorites.length > 0" class="text-center mb-6">
      <Button
        label="Generate Match!"
        icon="pi pi-heart"
        class="p-button-info"
        :loading="isGeneratingMatch"
        @click="handleGenerateMatch"
      />
    </div>
    <div v-if="userStore.match && showMatch" class="flex items-center justify-center min-h-screen">
      <div class="w-[640px] h-[660px]">
        <Card class="shadow-lg overflow-hidden bg-blue-50">
          <template #header>
            <div class="relative" data-cy="match-header">
              <img 
                :src="userStore.match.img" 
                :alt="userStore.match.name"
                class="w-full h-80 object-cover"
              />
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/100 to-transparent p-4">
                <h2 class="text-3xl font-bold text-white text-center">
                  Your Perfect Match: {{ userStore.match.name }}!
                </h2>
              </div>
            </div>
          </template>

          <template #content>
            <div class="space-y-6 p-2" data-cy="match-details">
              <div class="grid grid-cols-2 gap-6">
                <div class="bg-white p-4 rounded-lg shadow-sm">
                  <h3 class="font-semibold text-gray-500 mb-2">Breed</h3>
                  <p class="text-lg font-bold">{{ userStore.match.breed }}</p>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-sm">
                  <h3 class="font-semibold text-gray-500 mb-2">Age</h3>
                  <p class="text-lg font-bold">{{ userStore.match.age }} years</p>
                </div>
                <div class="col-span-2 bg-white p-4 rounded-lg shadow-sm">
                  <h3 class="font-semibold text-gray-500 mb-2">Location</h3>
                  <p class="text-lg font-bold">{{ userStore.match.city }}, {{ userStore.match.state }}, {{ userStore.match.zip_code }}</p>
                </div>
              </div>

              <div class="flex justify-center gap-4 mt-8">
                <Button
                  label="Show All Favorites"
                  icon="pi pi-list"
                  class="p-button-outlined  p-button-info"
                  @click="showMatch = false"
                />
                <Button
                  label="Try Another Match"
                  icon="pi pi-refresh"
                  class="p-button-info"
                  :loading="isGeneratingMatch"
                  @click="handleGenerateMatch"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <div v-else-if="isGeneratingMatch" class="text-center py-8">
      <ProgressSpinner data-cy="loading-spinner"/>
      <p class="mt-4 text-gray-600">Finding your perfect match...</p>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-cy="favorites-grid">
        <div 
          v-for="dog in userStore.favorites" 
          :key="dog.id" 
          class="rounded-2xl shadow-lg overflow-hidden"
        >
          <div class="relative bg-white p-2 rounded-t-3xl">
            <img 
              :src="dog.img" 
              :alt="dog.name" 
              class="w-full h-56 object-cover rounded-t-2xl"
            />
          </div>

          <div class="p-6 space-y-4 bg-gray-100 rounded-b-2xl">
            <div class="bg-white rounded-xl shadow-lg lg:p-6 p-4">
              <h3 class="text-2xl font-bold text-gray-900 text-center border-b border-gray-100 pb-3 mb-4">
                {{ dog.name }}
              </h3>
              
              <div class="space-y-4">
                <div class="">
                  <div class="flex items-baseline gap-2">
                    <span class="text-md text-gray-500">Breed</span>
                    <span class="text-gray-900 font-medium">{{ dog.breed }}</span>
                  </div>

                  <div class="flex items-baseline gap-2 mt-4">
                    <span class="text-md text-gray-500">Age</span>
                    <span class="text-gray-900 font-medium">{{ dog.age }} years</span>
                  </div>
                </div>
                
                <div class="flex items-baseline gap-2 mt-4">
                  <span class="text-md text-gray-500">Location</span>
                  <span class="text-gray-900 font-medium">{{ dog.city }}, {{ dog.state }}, {{ dog.zip_code }}</span>
                </div>
              </div>
            </div>

            <div class="border-t border-gray-300 my-4"></div>

            <div class="flex justify-center">
              <Button
                label="Remove Favorite"
                icon="pi pi-trash"
                class="p-button-help p-button-rounded w-3/4"
                @click="toggleFavorite(dog)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="userStore.favorites.length === 0" class="text-center py-8 text-gray-500">
        <i class="pi pi-heart text-4xl mb-4"></i>
        <p>You haven't added any favorites yet.</p>
        <RouterLink to="/" custom v-slot="{ navigate }">
          <Button
            data-cy="browse-dogs-button"
            label="Browse Dogs" 
            icon="pi pi-search"
            class="p-button-outlined p-button-info mt-4"
            @click="navigate"
          />
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDogStore } from '@/stores/dog-store'
import { useUserStore } from '@/stores/user-store'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import { RouterLink } from 'vue-router'
import type { Dog } from '@/types/interfaces'

const dogStore = useDogStore()
const userStore = useUserStore()
const isGeneratingMatch = ref(false)
const showMatch = ref(false)

const handleGenerateMatch = async () => {
  if (userStore.favorites.length === 0) return

  try {
    isGeneratingMatch.value = true
    await userStore.generateMatch()
    showMatch.value = true
  } catch (error) {
    console.error('Failed to generate match:', error)
  } finally {
    isGeneratingMatch.value = false
  }
}

const toggleFavorite = (dog: Dog) => {
  if (userStore.isFavorite(dog.id)) {
    userStore.removeFavorite(dog.id)
  }
}
</script>