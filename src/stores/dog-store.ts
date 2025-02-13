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
    
    searchParams.append('size', String(params?.size || 18))
    
    if (params?.sortField) {
      searchParams.append('sort', `${params.sortField}:${params.sortOrder || 'asc'}`)
    } else {
      searchParams.append('sort', 'breed:asc')
    }

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
      searchParams.append('from', String((currentPage.value - 1) * (params?.size || 18)))
    }

    return searchParams
  }

  const searchDogs = async (params?: SearchParams): Promise<SearchResults> => {
    isLoading.value = true
    try {
      const searchParams = buildSearchParams(params)
      const pageSize = params?.size || 18
      
      if (params?.state || params?.city) {
        return await handleLocationBasedSearch(params, searchParams, pageSize)
      }
      
      return await handleDirectSearch(searchParams)
    } catch (error) {
      console.error('Error searching dogs:', error)
      return createEmptySearchResults()
    } finally {
      isLoading.value = false
    }
  }

  // If no location selected
  const handleDirectSearch = async (searchParams: URLSearchParams): Promise<SearchResults> => {
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
  }


  // If location is selected
  const handleLocationBasedSearch = async (
    params: SearchParams, 
    searchParams: URLSearchParams,
    pageSize: number
  ): Promise<SearchResults> => {
    const { zipCodes: locationZipCodes } = await locationStore.searchLocations({
      state: params?.state || undefined,
      city: params?.city || undefined
    })
  
    if (locationZipCodes.length === 0) {
      return createEmptySearchResults()
    }
  
    let allDogIds: string[] = []
    searchParams.delete('size')
    searchParams.delete('from')
  
    for (let i = 0; i < locationZipCodes.length; i += 100) {
      const batchSearchParams = new URLSearchParams(searchParams)
      locationZipCodes.slice(i, i + 100).forEach(zipCode => {
        batchSearchParams.append('zipCodes', zipCode)
      })
  
      const searchResults = await api.get<{ resultIds: string[], total: number }>(
        `/dogs/search?${batchSearchParams.toString()}`
      )
  
      if (searchResults.resultIds?.length) {
        allDogIds.push(...searchResults.resultIds)
      }
    }
  
    if (allDogIds.length === 0) {
      return createEmptySearchResults()
    }
  
    return await processAndReturnResults(
      [...new Set(allDogIds)], 
      params, 
      pageSize
    )
  }

  // Client side pagination when location based search.
  const processAndReturnResults = async (
    uniqueDogIds: string[], 
    params: SearchParams, 
    pageSize: number
  ): Promise<SearchResults> => {
    const total = uniqueDogIds.length
    const startIndex = ((params?.page || 1) - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedDogIds = uniqueDogIds.slice(startIndex, endIndex)
  
    const dogDetails = await api.post<Dog[]>('/dogs', paginatedDogIds)
    const enrichedDogs = await locationStore.enrichDogsWithLocations(dogDetails)
  
    if (params?.sortField) {
      enrichedDogs.sort((a, b) => {
        const aValue = a[params.sortField!]
        const bValue = b[params.sortField!]
        const compareResult = 
          typeof aValue === 'string' 
            ? aValue.localeCompare(bValue as string)
            : (aValue as number) - (bValue as number)
        return params.sortOrder === 'desc' ? -compareResult : compareResult
      })
    }
  
    dogs.value = enrichedDogs
    totalDogs.value = total
  
    return {
      dogs: dogs.value,
      total: totalDogs.value,
      next: endIndex < total ? String(currentPage.value + 1) : null,
      prev: currentPage.value > 1 ? String(currentPage.value - 1) : null,
      currentPage: currentPage.value,
      noResults: false
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