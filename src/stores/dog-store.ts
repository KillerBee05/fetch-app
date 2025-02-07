import { defineStore } from "pinia"
import { ref } from "vue";
import api from "@/utils/api-helper"
import type { Dog, DogStore } from "@/types/interfaces";

export const useDogStore = defineStore('dog', (): DogStore => {
  const isLoading = ref<boolean>(false)
  const dogs = ref<Dog[]>([])
  const breeds = ref<string[]>([])
  const totalDogs = ref<number>(0)
  const currentPage = ref<number>(1)
  
  const fetchBreeds = async () => {
    isLoading.value = true
    try {
      return breeds.value = await api.get('/dogs/breeds')
    } finally {
      isLoading.value = false
    }
  }
  const searchDogs = async (params?: {
    breeds?: string[];
    ageMin?: number;
    ageMax?: number;
    size?: number;
    page?: number;
    sort?: string;
  }) => {
    isLoading.value = true
    try {
      const searchParams = new URLSearchParams()
  
      const searchParamsObj = params || {}
  
      if (searchParamsObj.page) {
        currentPage.value = Math.max(1, searchParamsObj.page)
      }

      if(searchParamsObj.breeds){
        searchParamsObj.breeds.forEach(breed => {
          searchParams.append('breeds', breed)
        })
      }
  
      if (searchParamsObj.ageMin) searchParams.set('ageMin', searchParamsObj.ageMin.toString())
      if (searchParamsObj.ageMax) searchParams.set('ageMax', searchParamsObj.ageMax.toString())
  
      const pageSize = searchParamsObj.size || 20
      searchParams.set('size', pageSize.toString())
      searchParams.set('sort', searchParamsObj.sort || 'breed:asc')
      searchParams.set('from', ((currentPage.value - 1) * pageSize).toString())
      
      const searchResults = await api.get(`/dogs/search?${searchParams.toString()}`)
      const dogDetails = await api.post('/dogs', searchResults.resultIds)

      dogs.value = dogDetails
      totalDogs.value = searchResults.total
  
      return {
        dogs: dogDetails,
        total: searchResults.total,
        next: searchResults.next,
        prev: searchResults.prev,
        currentPage: currentPage.value
      }
    } finally {
      isLoading.value = false
    }
  }

  const setCurrentPage = (page: number) => {
    currentPage.value = page
  }

  return {
    dogs,
    breeds,
    isLoading,
    totalDogs,
    currentPage,
    fetchBreeds,
    searchDogs,
    setCurrentPage
  }
})