import { defineStore } from "pinia";
import { ref } from "vue";
import type { UserStore, Dog } from "@/types/interfaces";
import api from "../utils/api-helper";

export const useUserStore = defineStore('user', (): UserStore => {
  const name = ref<string>('')
  const email = ref<string>('')
  const isLoading = ref<boolean>(false)
  // const favorites = ref<Dog>()

  const login = async (loginName: string, loginEmail: string) => {
    try {
      isLoading.value = true
      const response = await api.post('/auth/login', { 
        name: loginName, 
        email: loginEmail 
      })
      
      name.value = loginName
      email.value = loginEmail

      return response.data
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    name.value = ''
    email.value = ''
  }

  const addFavorite = (dog: {}) => {

  }

  const removeFavorite = (id: string) => {

  }

  return {
    isLoading: isLoading.value,
    name: name.value,
    email: email.value,
    // favorites,
    addFavorite,
    removeFavorite,
    login,
    logout
  }
})