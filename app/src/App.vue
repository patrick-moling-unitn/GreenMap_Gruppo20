<script setup>
import { ref, computed } from 'vue'
import Register from './components/Register.vue'
import Login from './components/Login.vue'
import OpenStreethMap from './components/OpenStreethMap.vue'
//import NotFound from './NotFound.vue'

const routes = {
  '/': OpenStreethMap,
  '/register': Register,
  '/login': Login,
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || '/'] || NotFound
})
</script>

<template>
  <a href="#/">Home</a> |
  <a href="#/register">Register</a> |
  <a href="#/login">Login</a>
  <component :is="currentView" />
</template>