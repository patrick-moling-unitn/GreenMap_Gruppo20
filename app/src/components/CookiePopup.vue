<template>
    <div id="cookieConsentOffcanvas" class="offcanvas offcanvas-bottom" tabindex="-1" data-bs-backdrop="static" aria-labelledby="cookieConsentOffcanvasLabel">
    <div class="offcanvas-header">
        <h5 class="offcanvas-title" id="offcanvasBottomLabel">Our website uses technical cookies only</h5>
    </div>
    <div class="offcanvas-body small">
        <div class="me-5">
            <p class="m-0 text-left">In order to save your authentication status an authentication Cookie is saved 
                on your browser to avoid making you login every time you refresh the WebPage.</p>
            <p class="m-0 text-left">Since none of your personal data will be used during this process we 
                strongly suggest keeping the Cookie enabled but it's up to you.</p>
            <div class="d-flex mt-5">
                <button type="button" class="btn btn-secondary" aria-label="Deny consent" @click="denyConsent">Deny consent</button>
                <button type="button" class="btn btn-primary ms-2" aria-label="Give consent" @click="giveConsent">Give consent</button>
            </div>
        </div>
    </div>
    </div>
</template>

<script default>
    import EventBus from '@/EventBus'
    export default {
        data(){
            return{
                offcanvas:''
            }
        },
        mounted(){
            var offcanvasElement = document.getElementById("cookieConsentOffcanvas");
            this.offcanvas = new bootstrap.Offcanvas(offcanvasElement);
            this.offcanvas.show();
        },
        methods: {
            denyConsent() {
                EventBus.emit('cookieConsentUpdated', false)
                this.offcanvas.hide();
            },
            giveConsent(){
                EventBus.emit('cookieConsentUpdated', true)
                this.offcanvas.hide();
            }
        }
    }
</script>