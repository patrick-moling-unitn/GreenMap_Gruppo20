<template>
    <div class="adaptive-margin-body">
        <button type="button" class="btn btn-success w-auto" @click="logout">Conferma logout</button>
    </div>
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