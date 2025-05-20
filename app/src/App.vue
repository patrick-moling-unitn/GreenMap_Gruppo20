<script setup>
import { ref, computed } from 'vue'
import Register from './components/Register.vue'
import Todo from './components/Todo.vue'
import ResolveReport from './components/ResolveReport.vue'
import Login from './components/Login.vue'
import Logout from './components/Logout.vue'
import OpenStreethMap from './components/OpenStreethMap.vue'
import ManageUsers from './components/ManageUsers.vue'
import ManageTrashcans from './components/ManageTrashcans.vue'
//import NotFound from './NotFound.vue'

import EventBus from './EventBus';

const API_VERSION = process.env.API_VERSION || "/api/v1"
const BASE_URL = process.env.SERVER_URL || "http://localhost:3000"
const SERVER_URL = String(BASE_URL) + String(API_VERSION)

const administrator = ref(false)
const authToken = ref('')

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE = false

const routes = {
  '/': OpenStreethMap,
  '/register': Register,
  '/login': Login,
  '/logout': Logout,
  '/resolveReport': ResolveReport,
  '/manageUsers' : ManageUsers,
  '/manageTrashcans': ManageTrashcans,
  '/todo': Todo
}

const currentPath = ref(window.location.hash)

function requiresAdministrator(path)
{
  if (path == "/resolveReport" || path == "/manageUsers" || path == "/manageTrashcans")
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
    if (LOG_MODE >= 1) console.log(window.location.hash + " requires authentication: " + requireAuth + " authenticated: "+authToken.value)
    window.location.hash = "#/login"
  }else if (requiresAdmin && !administrator.value){
    if (LOG_MODE >= 1) console.log(window.location.hash + " requires admin: " + requiresAdmin + " adminstrator: "+administrator.value)
    window.location.hash = "#/"
  }else if (requireLogout && authToken.value){
    if (LOG_MODE >= 1) console.log(window.location.hash + " requires logout: " + requireLogout + " authenticated: "+authToken.value)
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

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

const loginHandler = function(newAuthToken) {
  let data = parseJwt(newAuthToken);
  if (LOG_MODE >= 1) console.log(`User logged in and has the following auth token: ${newAuthToken} and admin value: ${data.administrator}`)
  administrator.value = data.administrator;
  authToken.value = newAuthToken;
  window.location.hash = "#/"
  alert("Logged in")
}

const logoutHandler = function() {
  if (LOG_MODE >= 2) console.log(`User logged out`)
  administrator.value = false;
  authToken.value = null;
  window.location.hash = "#/"
  alert("Logged out")
}

const registrationHandler = function() {
  if (LOG_MODE >= 2) console.log(`User registered`)
  window.location.hash = "#/login"
  alert("Registered")
}

const sendAuthToken = function(currentToken) {
  if (LOG_MODE >= 2) console.log("New auth token: " + (currentToken !== authToken.value))
  if (currentToken !== authToken.value)
    EventBus.emit('authToken', authToken.value)
}

const sendServerUrl = function() {
  console.log("emit ", SERVER_URL)
  EventBus.emit('serverUrl', SERVER_URL)
}

EventBus.on('loggedin', loginHandler)
EventBus.on('loggedout', logoutHandler)
EventBus.on('registered', registrationHandler)
EventBus.on('authTokenRequest', sendAuthToken)
EventBus.on('serverUrlRequest', sendServerUrl)
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
      <a href="#/manageTrashcans">Manage Trashcans</a> |
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
      <component :is="currentView" :admin="administrator"/>
    </KeepAlive>
  </body>
</template>

<style scoped>
    .header-div, .body-div{
      padding: 5px;
      display: flex;
      flex-direction: column;
    }
</style>