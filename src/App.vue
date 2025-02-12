<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const showNav = computed(() => route.name !== 'login')
</script>

<template>
  <nav v-if="showNav" class="p-4">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink class="ml-4" to="/match">Match</RouterLink>
  </nav>
  
  <RouterView />
</template>