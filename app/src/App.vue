<script setup>
import { ref, computed } from 'vue'
import Register from './components/Register.vue'
import OpenStreethMap from './components/OpenStreethMap.vue'
//import NotFound from './NotFound.vue'

const routes = {
  '/': OpenStreethMap,
  '/register': Register,
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
  <a href="#/register">Register</a>
  <component :is="currentView" />
</template>