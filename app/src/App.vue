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
import CookiePopup from './components/CookiePopup.vue'
//import NotFound from './NotFound.vue'

import EventBus from './EventBus';
import CookieManager from './cookieManager'

const askedCookieConsent = ref(false)
const administrator = ref(false)
const authToken = ref('')

const AUTHENTICATION_TOKEN_COOKIE_NAME = "AuthenticationToken"
const COOKIES_CONSENT_LOCAL_STORAGE_NAME = "CookiesConsent"

const CookieManagerClass = new CookieManager();

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE = false

let API_VERSION = "/api/v1"
let BASE_URL = "http://localhost:3000"

if (LOG_MODE >= 2)  
  console.log(import.meta.env.MODE)

if (import.meta.env.MODE === "production") {
  API_VERSION = import.meta.env.VITE_API_VERSION
  BASE_URL = import.meta.env.VITE_SERVER_URL
  if (LOG_MODE >= 1) {
    console.warn("!-- Ambiente di produzione --!")
    console.warn("Se stai sviluppando funzionalità in locale fai partire il server usando 'npm run dev' anzichè build")
  }
}

const SERVER_URL = String(BASE_URL) + String(API_VERSION)

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
  
  if (localStorage.getItem(COOKIES_CONSENT_LOCAL_STORAGE_NAME) == `${true}`)
    CookieManagerClass.createCookie(AUTHENTICATION_TOKEN_COOKIE_NAME, newAuthToken, data.expiresIn);

  window.location.hash = "#/"
  alert("Logged in")
}

const logoutHandler = function() {
  if (LOG_MODE >= 2) console.log(`User logged out`)
  administrator.value = false;
  authToken.value = null;

  if (localStorage.getItem(COOKIES_CONSENT_LOCAL_STORAGE_NAME) == `${true}`)
    CookieManagerClass.deleteCookie(AUTHENTICATION_TOKEN_COOKIE_NAME);

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
  if (LOG_MODE >= 1) console.log("Server URL: ", SERVER_URL)
  EventBus.emit('serverUrl', SERVER_URL)
}

const updateCookiesConsent = function(hasConsent){
  localStorage.setItem(COOKIES_CONSENT_LOCAL_STORAGE_NAME, hasConsent);
  askedCookieConsent.value = true;

  if (!hasConsent)
    CookieManagerClass.deleteCookie(AUTHENTICATION_TOKEN_COOKIE_NAME);
}

//Richieste (indirettamente) eseguite dall'utente
EventBus.on('loggedin', loginHandler)
EventBus.on('loggedout', logoutHandler)
EventBus.on('registered', registrationHandler)
EventBus.on('cookieConsentUpdated', updateCookiesConsent)

//Richieste eseguite dai componenti VueJS
EventBus.on('authTokenRequest', sendAuthToken)
EventBus.on('serverUrlRequest', sendServerUrl)

let hasCookieConsent = localStorage.getItem(COOKIES_CONSENT_LOCAL_STORAGE_NAME)
askedCookieConsent.value = hasCookieConsent != null

if (LOG_MODE >= 1 && hasCookieConsent != null) console.log("Accepted cookies: " + hasCookieConsent);

if (hasCookieConsent && CookieManagerClass.getCookie(AUTHENTICATION_TOKEN_COOKIE_NAME) != null){
  let authTokenCookie = CookieManagerClass.getCookie(AUTHENTICATION_TOKEN_COOKIE_NAME);
  if (LOG_MODE >= 1)  
    console.log("AuthTokenCookie: ", authTokenCookie);
  loginHandler(authTokenCookie);
}
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
    <CookiePopup v-if="!askedCookieConsent"></CookiePopup>
  </body>
</template>

<style scoped>
    .header-div, .body-div{
      padding: 5px;
      display: flex;
      flex-direction: column;
    }
</style>