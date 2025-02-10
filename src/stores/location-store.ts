import { defineStore } from "pinia"
import { ref, computed } from "vue"
import api from "@/utils/api-helper"
import { states } from '@/data/states'
import type { Location, LocationSearchResponse, Dog } from "@/types/interfaces"

export const useLocationStore = defineStore('location', () => {
  const isLoading = ref(false)

  const getAvailableStates = computed(() => 
    states.sort((a, b) => a.name.localeCompare(b.name))
  )

  const getAvailableCitiesForState = async (state: string): Promise<string[]> => {
    if (!state) return []
    
    try {
      const response = await api.post<LocationSearchResponse>('/locations/search', {
        states: [state],
        size: 10000
      })
      
      return [...new Set(
        response.results
          .map(loc => loc.city)
          .filter((city): city is string => !!city)
      )].sort()
    } catch (error) {
      console.error('Error fetching cities:', error)
      return []
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
    getAvailableStates,
    getAvailableCitiesForState,
    enrichDogsWithLocations
  }
})