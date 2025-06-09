<template>
  <div class="adaptive-margin-body">
    <h1>Login using existing account</h1>
    
    <form @submit.prevent="handleSubmit" class="p-4 mt-4">
      <div>
        <label for="email" class="form-label">Email:</label>
        <input id="email" v-model="form.email" type="email" class="form-control w-75" placeholder="name@example.com" required />
      </div>

      <div class="mt-2">
        <label for="password" class="form-label">Password:</label>
        <input id="password" v-model="form.password" class="form-control w-75" type="password" required />
      </div>

      <div class="mt-4">
        <LoadingSpinner v-if="logginIn"></LoadingSpinner>
        <button class="btn btn-success" type="submit" v-else>Login</button>
      </div>
    </form>
  </div>
</template>

<script>
import EventBus from '@/EventBus';
import UrlManager from '@/urlManager'
import errors from '@enum/errorCodesDecoded.esm';
import LoadingSpinner from './LoadingSpinner.vue';

export default {
    components: {
      LoadingSpinner
    },
    data() {
        return {
            form: {
                email: '',
                password: ''
            },
            logginIn: false,
        }
    },
    methods: {
        handleSubmit() {
            console.log('Dati inviati:', this.form);
            this.logginIn = true;
            fetch(`${UrlManager()}/authenticatedUsers`, {
                method: "POST",
                body: JSON.stringify({
                    email: this.form.email,
                    password: this.form.password
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })
            .then(response => {
              if (!response.ok) {
                console.log("Errore nella risposta:", response);
                alert("Errore nelle credenziali");
                return;
              }
              return response.json();
            })
            .then(data => {
              if (data && data.authToken){
                EventBus.emit('loggedin', data.authToken);
                this.form.email = '';
                this.form.password = '';
              }
              else {
                alert(errors[data.errorCode])
              }
            }).catch(() =>{
              alert("Network error. Please try again later!")
            }).finally(() => {
              this.logginIn = false;
            });
        }
    }
}
</script>