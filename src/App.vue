<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <nav class="p-4">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink class="ml-4" to="/login">Login</RouterLink>
  </nav>
  
  <RouterView />
</template>