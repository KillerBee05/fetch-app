import { defineStore } from "pinia"
import { ref } from "vue"
import api from "@/utils/api-helper"
import { useLocationStore } from './location-store'
import type { Dog, SearchParams, SearchResults } from "@/types/interfaces"

export const useDogStore = defineStore('dog', () => {
  const isLoading = ref(false)
  const currentPage = ref(1)
  const dogs = ref<Dog[]>([])
  const breeds = ref<string[]>([])
  const totalDogs = ref(0)

  const locationStore = useLocationStore()

  const fetchBreeds = async () => {
    isLoading.value = true
    try {
      const allBreeds = await api.get<string[]>('/dogs/breeds')
      breeds.value = allBreeds.sort((a, b) => a.localeCompare(b))
      return breeds.value
    } finally {
      isLoading.value = false
    }
  }

  const buildSearchParams = (params?: SearchParams): URLSearchParams => {
    const searchParams = new URLSearchParams()
    
    searchParams.append('size', String(params?.size || 25))
    searchParams.append('sort', 'breed:asc')

    params?.breeds?.forEach(breed => {
      searchParams.append('breeds', breed)
    })

    if (typeof params?.ageMin === 'number') {
      searchParams.append('ageMin', String(params.ageMin))
    }
    if (typeof params?.ageMax === 'number') {
      searchParams.append('ageMax', String(params.ageMax))
    }

    if (params?.page) {
      currentPage.value = Math.max(1, params.page)
      searchParams.append('from', String((currentPage.value - 1) * (params?.size || 25)))
    }

    return searchParams
  }

  const searchLocations = async (params: SearchParams): Promise<string[]> => {
    if (!params.state && !params.city) return []

    const locationSearchBody: Record<string, any> = {}
    
    if (params.state) {
      locationSearchBody.states = [params.state]
    }
    if (params.city) {
      locationSearchBody.city = params.city
    }

    try {
      const locationResponse = await api.post<{ results: { zip_code: string }[], total: number }>(
        '/locations/search', 
        { 
          ...locationSearchBody, 
          size: 10000 
        }
      )

      const locationZipCodes = [...new Set(
        locationResponse.results.map(location => location.zip_code)
      )]

      return locationZipCodes.slice(0, 100)
    } catch (error) {
      console.error('Location search error:', error)
      return []
    }
  }

  const searchDogs = async (params?: SearchParams): Promise<SearchResults> => {
    isLoading.value = true
    try {
      const searchParams = buildSearchParams(params)

      const locationZipCodes = await searchLocations(params || {})

      if ((params?.state || params?.city) && locationZipCodes.length === 0) {
        return createEmptySearchResults()
      }

      if (locationZipCodes.length > 0) {
        locationZipCodes.forEach(zipCode => {
          searchParams.append('zipCodes', zipCode)
        })
      }
      
      const searchResults = await api.get<{ 
        resultIds: string[], 
        total: number, 
        next?: string, 
        prev?: string 
      }>(`/dogs/search?${searchParams.toString()}`)
 
      if (!searchResults.resultIds?.length) {
        return createEmptySearchResults()
      }

      const dogDetails = await api.post<Dog[]>('/dogs', searchResults.resultIds)

      dogs.value = await locationStore.enrichDogsWithLocations(dogDetails)
      totalDogs.value = searchResults.total

      return {
        dogs: dogs.value,
        total: totalDogs.value,
        next: searchResults.next ?? null,
        prev: searchResults.prev ?? null,
        currentPage: currentPage.value,
        noResults: false
      }
    } catch (error) {
      console.error('Error searching dogs:', error)
      return createEmptySearchResults()
    } finally {
      isLoading.value = false
    }
  }

  const createEmptySearchResults = (): SearchResults => ({
    dogs: [], 
    total: 0, 
    next: null, 
    prev: null, 
    currentPage: currentPage.value,
    noResults: true
  })


  return {
    dogs,
    breeds,
    isLoading,
    totalDogs,
    currentPage,
    fetchBreeds,
    searchDogs
  }
})