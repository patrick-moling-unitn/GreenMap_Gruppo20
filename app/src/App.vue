<script setup>
import { ref, computed } from 'vue'
import Register from './components/Register.vue'
import Todo from './components/Todo.vue'
import Login from './components/Login.vue'
import Logout from './components/Logout.vue'
import OpenStreethMap from './components/OpenStreethMap.vue'
//import NotFound from './NotFound.vue'

import EventBus from './EventBus';

const API_VERSION = "/api/v1"
const authToken = ref('')

const routes = {
  '/': OpenStreethMap,
  '/register': Register,
  '/login': Login,
  '/logout': Logout,
  '/todo': Todo
}

const currentPath = ref(window.location.hash)

function requiresAuthentication(path)
{
  if (path == "/logout")
    return true;

  return false;
}

function requiresLogout(path)
{
  if (path == "/register" || path == "/login")
    return true;

  return false;
}

window.addEventListener('hashchange', () => {
  let requireAuth = requiresAuthentication(window.location.hash.slice(1)),
      requireLogout = requiresLogout(window.location.hash.slice(1));
      
  if (requireAuth && !authToken.value){
    console.log(window.location.hash + " requires authentication: " + requireAuth + " authenticated: "+authToken.value)
    window.location.hash = "#/login"
  }else if (requireLogout && authToken.value){
    console.log(window.location.hash + " requires logout: " + requireLogout + " authenticated: "+authToken.value)
    window.location.hash = "#/logout"
  }
    
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  let path = currentPath.value.slice(1);
  return routes[path || '/'] || NotFound
})

const loginHandler = function(recievedToken) {
  console.log(`User logged in and has the following auth token: ${recievedToken}`)
  authToken.value = recievedToken;
  window.location.hash = "#/"
  alert("Logged in")
}

const logoutHandler = function() {
  console.log(`User logged out`)
  authToken.value = null;
  window.location.hash = "#/"
  alert("Logged out")
}

const sendAuthToken = function(currentToken) {
  console.log("New auth token: " + (currentToken !== authToken.value))
  if (currentToken !== authToken.value)
    EventBus.emit('authToken', authToken.value)
}

const sendApiVersion = function() {
  EventBus.emit('apiVersion', API_VERSION)
}

EventBus.on('loggedin', loginHandler)
EventBus.on('loggedout', logoutHandler)
EventBus.on('authTokenRequest', sendAuthToken)
EventBus.on('apiVersionRequest', sendApiVersion)
</script>

<template>
  <header>
    <div class="header-div" v-if="!authToken">
      <a href="#/">Home</a> |
      <a href="#/register">Register</a> |
      <a href="#/login">Login</a>
    </div>
    <div class="header-div" v-else>
      <a href="#/">Home</a> |
      <a href="#/todo">Issue Report</a> |
      <a href="#/todo">Compile Questionnaire</a> |
      <a href="#/logout">Logout</a>
    </div>
  </header>
  <body>
    <KeepAlive>
      <component :is="currentView" />
    </KeepAlive>
  </body>
</template>

<style scoped>
    .header-div{
      padding: 5px;
    }
</style>