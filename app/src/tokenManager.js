// E' una classe che permette di ricevere l'authToken memorizzato nel componente App.vue
// tramite l'EventBus.js invoca la richiesta per ricevere l'authToken a cui risponderà
// appunto App.vue invocando a sua volta un'evento risposta ed inviando l'authToken
import EventBus from './EventBus'

let authToken;
const updateAuthToken = (newToken) => authToken = newToken
EventBus.on('authToken', updateAuthToken)

export default function getAuthToken(){
    EventBus.emit('authTokenRequest')
    return authToken;
}