// E' una classe che permette di passare parametri ed invocare eventi da un componente 
// di VueJS ad un'altro. Viene usata principalmente per gestire gli eventi di Login e 
// Logout. Infine viene usata per coordinare lo scambio dell'authToken fra componenti.
import mitt from 'mitt';
const emitter = mitt();
export default emitter;