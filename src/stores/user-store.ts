import { defineStore } from "pinia";
import { ref } from "vue";
import api from "../utils/api-helper";
import type { UserStore, Dog } from "@/types/interfaces";
import type { LoginResponse } from '../types/interfaces'

export const useUserStore = defineStore('user', (): UserStore => {
  const name = ref<string>('')
  const email = ref<string>('')
  const isLoading = ref<boolean>(false)
  const favorites = ref<Dog[]>([])

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
      
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
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
    isLoading: isLoading.value,
    name: name.value,
    email: email.value,
    favorites: favorites.value,
    addFavorite,
    removeFavorite,
    isFavorite,
    login,
    logout
  }
})