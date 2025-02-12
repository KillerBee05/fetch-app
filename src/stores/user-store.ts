import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../utils/api-helper";
import type { Dog } from "@/types/interfaces";
import type { LoginResponse } from '../types/interfaces'

export const useUserStore = defineStore('user', () => {
  const name = ref<string>('')
  const email = ref<string>('')
  const isLoading = ref<boolean>(false)
  const favorites = ref<Dog[]>([])
  const match = ref<Dog | null>(null)

  const login = async (userName: string, userEmail: string): Promise<LoginResponse['data']> => {
    try {
      isLoading.value = true
      const response = await api.post<LoginResponse>('/auth/login', { 
        name: userName, 
        email: userEmail 
      })
      
      name.value = userName
      email.value = userEmail
      favorites.value = []
      match.value = null
      
      return response.data
    } finally {
      isLoading.value = false
    }
  }
  
  const logout = async () => {
    try {
      isLoading.value = true
      await api.post('/auth/logout')
      
      name.value = ''
      email.value = ''
      favorites.value = []
      match.value = null
      
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const generateMatch = async (): Promise<void> => {
    try {
      isLoading.value = true
      const favoriteIds = favorites.value.map(dog => dog.id)
      
      if (favoriteIds.length === 0) {
        throw new Error('Please add some favorites before generating a match')
      }

      const response = await api.post<{ match: string }>('/dogs/match', favoriteIds)
      const matchedDog = favorites.value.find(dog => dog.id === response.match)
      
      if (!matchedDog) {
        throw new Error('Could not find matching dog')
      }

      match.value = matchedDog
    } finally {
      isLoading.value = false
    }
  }

  const addFavorite = (dog: Dog) => {
    if (favorites.value.length >= 10) {
      throw new Error('Maximum of 10 favorites allowed')
    }
    if (!favorites.value.some(fav => fav.id === dog.id)) {
      favorites.value.push(dog)
    }
  }

  const removeFavorite = (id: string) => {
    favorites.value = favorites.value.filter(dog => dog.id !== id)
  }

  const isFavorite = (id: string): boolean => {
    return favorites.value.some(dog => dog.id === id)
  }

  return {
    isLoading,
    name,
    email,
    favorites,
    match,
    addFavorite,
    removeFavorite,
    isFavorite,
    generateMatch,
    login,
    logout
  }
}, {
  persist: true
})