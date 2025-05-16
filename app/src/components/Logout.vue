<template>
    <button @click="logout">Conferma logout</button>
</template>


<script>
import EventBus from '@/EventBus';
export default {
    methods: {
        logout(){
            EventBus.emit('loggedout');
        }
    },
}
</script>

<style>
button {
  padding: 0.6rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #369f75;
}
</style>