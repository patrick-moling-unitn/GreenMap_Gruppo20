<script setup>
import { ref, computed } from 'vue'
import Register from './components/Register.vue'
import Todo from './components/Todo.vue'
import Login from './components/Login.vue'
import OpenStreethMap from './components/OpenStreethMap.vue'
//import NotFound from './NotFound.vue'

import EventBus from './EventBus';

const authToken = ref('')

const routes = {
  '/': OpenStreethMap,
  '/register': Register,
  '/login': Login,
  '/todo': Todo
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || '/'] || NotFound
})

const loginHandler = function(recievedToken) {
  console.log(`User logged in and has the following auth token: ${recievedToken}`)
  authToken.value = recievedToken;
}

EventBus.on('loggedin', loginHandler)
</script>

<template>
  <div class="full-width" v-if="!authToken">
    <a href="#/">Home</a> |
    <a href="#/register">Register</a> |
    <a href="#/login">Login</a>
  </div>
  <div class="full-width" v-else>
    <a href="#/">Home</a> |
    <a href="#/todo">Issue Report</a> |
    <a href="#/todo">Compile Questionnaire</a>
  </div>
<KeepAlive>
  <component :is="currentView" />
</KeepAlive>
</template>

<style scoped>
    .full-width{
      padding: 5px;
    }
</style>