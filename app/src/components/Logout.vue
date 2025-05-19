<template>
    <button type="button" class="btn btn-success" @click="logout">Conferma logout</button>
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