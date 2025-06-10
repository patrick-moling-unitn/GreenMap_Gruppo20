<template>
    <h1>What are you looking for?</h1>

    <div class="d-flex align-items-center mt-4">
        <h5 class="mt-1">Seems like you got lost. Maybe you want to go back to the </h5>
        <button class="btn ms-2 btn-outline-success" @click="goBackToHomePage()">Home Page</button>
    </div>
</template>

<script default>
import EventBus from '@/EventBus'
export default {
    methods: {
        goBackToHomePage() {
            EventBus.emit('backToHomeRequest');
        }
    }
}
</script>