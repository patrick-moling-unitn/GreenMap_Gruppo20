// E' una classe che permette di ricevere la versione API memorizzata nel componente App.vue
// tramite l'EventBus.js invoca la richiesta per ricevere la versione API a cui risponderà
// appunto App.vue invocando a sua volta un'evento risposta ed inviando la versione API
import EventBus from './EventBus'

let apiVersion = null;
const updateApiVersion = (newApiVersion) => apiVersion = newApiVersion
EventBus.on('apiVersion', updateApiVersion)

export default function getApiVersion(){
    if (!apiVersion) EventBus.emit('apiVersionRequest')
    return apiVersion;
}