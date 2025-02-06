import { defineStore } from "pinia"
import { ref } from "vue";
import api from "@/utils/api-helper"
import type { Dog, DogStore } from "@/types/interfaces";

export const useDogStore = defineStore('dog', (): DogStore => {
  const isLoading = ref<boolean>(false)
  const dogs = ref<Dog[]>([])

  const fetchDogs = async () => {
    isLoading.value = true
    try{
      return dogs.value = await api.get('/dogs/breeds')
    } finally {
      isLoading.value = false
    }
  }

  return {
    dogs: dogs.value,
    isLoading: isLoading.value,
    fetchDogs
  }
})