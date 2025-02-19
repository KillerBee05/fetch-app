import type { ComputedRef, Ref } from 'vue'

export interface LoginResponse {
  data: {
    token?: string;
  }
}

export interface UserStore {
  isLoading: boolean
  name: string
  email: string
  favorites: Dog[]
  addFavorite: (dog: Dog) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  login: (name: string, email: string) => Promise<any>
  logout: () => void
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
  ageMin?: number
  ageMax?: number
  state?: string
  city?: string
  page?: number
  size?: number
  sortField?: 'breed' | 'name' | 'age'
  sortOrder?: 'asc' | 'desc'
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
  isLoading: Ref<boolean>
  selectedState: Ref<string>
  locationCache: Ref<Map<string, { cities: string[], zipCodes: string[] }>>
  getAvailableStates: ComputedRef<{ name: string; abbreviation: string }[]>
  getAvailableCitiesForState: ComputedRef<string[]>
  searchLocations: (params: { state?: string, city?: string }) => Promise<{
    zipCodes: string[]
    cities: string[]
  }>
  enrichDogsWithLocations: (dogs: Dog[]) => Promise<(Dog & { city: string; state: string })[]>
}

export interface LocationSearchParams {
  state?: string | null
  city?: string | null
}

export interface LocationSearchResult {
  zipCodes: string[]
  cities: string[]
}