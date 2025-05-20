// E' una classe che permette di ricevere la versione API memorizzata nel componente App.vue
// tramite l'EventBus.js invoca la richiesta per ricevere la versione API a cui risponderà
// appunto App.vue invocando a sua volta un'evento risposta ed inviando la versione API
import EventBus from './EventBus'

let serverUrl = null;
const updateServerUrl = (newServerUrl) => serverUrl = newServerUrl
EventBus.on('serverUrl', updateServerUrl)

export default function getApiVersion(){
    if (!serverUrl) EventBus.emit('serverUrlRequest')
    return serverUrl;
}