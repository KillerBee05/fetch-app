/// <reference types="cypress" />

import type { useLocationStore } from '@/stores/location-store'
import type { useDogStore } from '@/stores/dog-store'
import type { 
  Dog, 
  LoginResponse, 
  UserStore, 
  SearchParams, 
  SearchResults, 
  Location,
  DogStore,
  LocationStore
} from '@/types/interfaces'

// Type-only import to satisfy linter
export type {
  useLocationStore,
  useDogStore
}

declare global {
  namespace Cypress {
    interface Window {
      $store: {
        user: UserStore
        location: ReturnType<typeof useLocationStore>
        dog: ReturnType<typeof useDogStore>
      }
    }
  }
}

// Re-export the types for use in tests
export type { 
  Dog, 
  LoginResponse, 
  UserStore, 
  SearchParams, 
  SearchResults, 
  Location,
  DogStore,
  LocationStore
}