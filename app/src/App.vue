<script setup>
import { ref, computed } from 'vue'
import Register from './components/Register.vue'
import Todo from './components/Todo.vue'
import ResolveReport from './components/ResolveReport.vue'
import Login from './components/Login.vue'
import Logout from './components/Logout.vue'
import OpenStreethMap from './components/OpenStreethMap.vue'
import ManageUsers from './components/ManageUsers.vue'
//import NotFound from './NotFound.vue'

import EventBus from './EventBus';

const API_VERSION = "/api/v1"
const administrator = ref(false)
const authToken = ref('')
const TEST_MODE = false

const routes = {
  '/': OpenStreethMap,
  '/register': Register,
  '/login': Login,
  '/logout': Logout,
  '/resolveReport': ResolveReport,
  '/manageUsers' : ManageUsers,
  '/todo': Todo
}

const currentPath = ref(window.location.hash)

function requiresAdministrator(path)
{
  if (path == "/resolveReport")
    return true;

  return false;
}

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

function calculateCurrentPath(){
  let requireAuth = requiresAuthentication(window.location.hash.slice(1)),
      requiresAdmin = requiresAdministrator(window.location.hash.slice(1)),
      requireLogout = requiresLogout(window.location.hash.slice(1));
      
  if (requireAuth && !authToken.value){
    console.log(window.location.hash + " requires authentication: " + requireAuth + " authenticated: "+authToken.value)
    window.location.hash = "#/login"
  }else if (requiresAdmin && !administrator.value){
    console.log(window.location.hash + " requires admin: " + requiresAdmin + " adminstrator: "+administrator.value)
    window.location.hash = "#/"
  }else if (requireLogout && authToken.value){
    console.log(window.location.hash + " requires logout: " + requireLogout + " authenticated: "+authToken.value)
    window.location.hash = "#/logout"
  }
    
  currentPath.value = window.location.hash
}

window.addEventListener('hashchange', () => {
  calculateCurrentPath();
})

const currentView = computed(() => {
  calculateCurrentPath();
  let path = currentPath.value.slice(1);
  return routes[path || '/'] || NotFound
})

const loginHandler = function(data) {
  console.log(`User logged in and has the following auth token: ${data.token} and admin value: ${data.admin}`)
  administrator.value = data.admin;
  authToken.value = data.token;
  window.location.hash = "#/"
  alert("Logged in")
}

const logoutHandler = function() {
  console.log(`User logged out`)
  administrator.value = false;
  authToken.value = null;
  window.location.hash = "#/"
  alert("Logged out")
}

const registrationHandler = function() {
  console.log(`User registered`)
  window.location.hash = "#/login"
  alert("Registered")
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
EventBus.on('registered', registrationHandler)
EventBus.on('authTokenRequest', sendAuthToken)
EventBus.on('apiVersionRequest', sendApiVersion)
</script>

<template>
  <header class="header-div">
    <div v-if="!authToken">
      <a href="#/">Home</a> |
      <a href="#/register">Register</a> |
      <a href="#/login">Login</a>
    </div>
    <div v-else-if="TEST_MODE || administrator">
      <a href="#/">Home</a> |
      <a href="#/resolveReport">Resolve Report</a> |
      <a href="#/manageUsers">Manage Users</a> |
      <a href="#/logout">Logout</a>
    </div>
    <div v-else>
      <a href="#/">Home</a> |
      <a href="#/todo">Compile Questionnaire</a> |
      <a href="#/todo">Get Discount</a> |
      <a href="#/todo">View Profile</a> |
      <a href="#/logout">Logout</a>
    </div>

  </header>
  <body class="body-div">
    <KeepAlive>
      <component :is="currentView"/>
    </KeepAlive>
  </body>
</template>

<style scoped>
    .header-div{
      padding: 5px;
    }
    .body-div{
      padding: 5px;
    }
</style>