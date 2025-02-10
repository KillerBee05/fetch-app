import type { ComputedRef, Ref } from 'vue'

export interface UserStore {
  name: string
  email: string
  isLoading: boolean
  login: (name: string, email: string) => Promise<any>
  logout: () => void
  addFavorite: (dog: Dog) => void
  removeFavorite: (dogId: string) => void
}

export interface Dog {
  id: string
  breed: string
  name: string
  age: number
  zip_code: string
  img: string
  city?: string
  state?: string
}

export interface SearchParams {
  breeds?: string[]
  state?: string | null
  city?: string | null
  ageMin?: number
  ageMax?: number
  size?: number
  page?: number
}

export interface SearchResults {
  dogs: Dog[]
  total: number
  next: string | null
  prev: string | null
  currentPage: number
  noResults: boolean
}

export interface Location {
  zip_code: string
  latitude: number
  longitude: number
  city: string
  state: string
  county: string
}

export interface LocationSearchResponse {
  results: Location[]
  total: number
}

export interface DogStore {
  dogs: Ref<Dog[]>
  breeds: Ref<string[]>
  isLoading: Ref<boolean>
  totalDogs: Ref<number>
  currentPage: Ref<number>
  fetchBreeds: () => Promise<string[]>
  searchDogs: (params?: SearchParams) => Promise<SearchResults>
  setCurrentPage: (page: number) => void
}

export interface LocationStore {
  locations: Ref<Location[]>
  isLoading: Ref<boolean>
  getAvailableStates: ComputedRef<{ name: string; abbreviation: string }[]>
  getAvailableCitiesForState: (state: string) => Promise<string[]>
  enrichDogsWithLocations: (dogs: Dog[]) => Promise<(Dog & { city: string; state: string })[]>
}