import { defineStore } from "pinia"
import { ref, computed } from "vue"
import api from "@/utils/api-helper"
import { states } from '@/data/states'
import type { Location, Dog } from "@/types/interfaces"

export const useLocationStore = defineStore('location', () => {
  const isLoading = ref(false)
  const selectedState = ref<string>('')
  const locationCache = ref<Map<string, { cities: string[], zipCodes: string[] }>>(new Map())

  const getAvailableStates = computed(() => 
    states.sort((a, b) => a.name.localeCompare(b.name))
  )

  const getAvailableCitiesForState = computed(() => {
    if(!selectedState.value) return []
    return locationCache.value.get(selectedState.value)?.cities || []
  })

  const searchLocations = async (params: { state?: string, city?: string }): Promise<{ 
    zipCodes: string[], 
    cities: string[] 
  }> => {
    if (!params.state && !params.city) return { zipCodes: [], cities: [] }

    if (params.state && !params.city && locationCache.value.has(params.state)) {
      return locationCache.value.get(params.state)!
    }

    const locationSearchBody: Record<string, any> = {
      size: 10000
    }
    
    if (params.state) {
      locationSearchBody.states = [params.state]
    }
    if (params.city) {
      locationSearchBody.city = params.city
    }

    try {
      const response = await api.post<{ 
        results: { zip_code: string, city: string }[], 
        total: number 
      }>('/locations/search', locationSearchBody)

      const result = {
        zipCodes: [...new Set(
          response.results.map(location => location.zip_code)
        )],
        cities: [...new Set(
          response.results
            .map(loc => loc.city)
            .filter((city): city is string => !!city)
        )].sort()
      }

      if (params.state && !params.city) {
        locationCache.value.set(params.state, result)
      }

      return result
    } catch (error) {
      console.error('Location search error:', error)
      return { zipCodes: [], cities: [] }
    }
  }

  const enrichDogsWithLocations = async (dogs: Dog[]): Promise<(Dog & { city: string; state: string })[]> => {
    const zipCodes = [...new Set(dogs.map(dog => dog.zip_code))]
    
    try {
      const locationBatches: Location[] = []
      const batchSize = 100
      
      for (let i = 0; i < zipCodes.length; i += batchSize) {
        const batchZips = zipCodes.slice(i, i + batchSize)
        const batchLocations = await api.post<Location[]>('/locations', batchZips)
        locationBatches.push(...batchLocations)
      }
      
      const locationMap = new Map(
        locationBatches
          .filter((loc): loc is Location => loc !== null)
          .map(loc => [loc.zip_code, loc])
      )
      
      return dogs.map(dog => {
        const location = locationMap.get(dog.zip_code)
        return {
          ...dog,
          city: location?.city ?? "Unknown",
          state: location?.state ?? "Unknown"
        }
      })
    } catch (error) {
      console.error('Error enriching dogs with locations:', error)
      return dogs.map(dog => ({
        ...dog,
        city: "Unknown",
        state: "Unknown"
      }))
    }
  }

  return {
    isLoading,
    selectedState,
    getAvailableStates,
    getAvailableCitiesForState,
    searchLocations,
    enrichDogsWithLocations
  }
})