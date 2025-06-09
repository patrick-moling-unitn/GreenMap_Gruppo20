<template>
  <EmailVerification v-if="this.verification.id" :userId="this.verification.id" :resetUserIdCallback="this.resetUserIdCallback"/>
  <div class="adaptive-margin-body" v-else>
    <h1>Register new account</h1>
    <form @submit.prevent="handleSubmit" class="p-4 mt-4">
      <div>
        <label for="email" class="form-label">Email:</label>
        <input id="email" v-model="form.email" type="email" class="form-control w-75" placeholder="name@example.com" required />
      </div>

      <div class="mt-2">
        <label for="password" class="form-label">Password:</label>
        <input id="password" v-model="form.password" class="form-control w-75" type="password" aria-describedby="passwordHelpBlock" required />
        <div id="passwordHelpBlock" class="form-text">
          Your password must be at least 8 characters long
        </div>
      </div>

      <div class="mt-4">
        <LoadingSpinner v-if="registering"></LoadingSpinner>
        <button class="btn btn-success" type="submit" v-else>Register</button>
      </div>
    </form>
  </div>
</template>

<script>
import EmailVerification from './EmailVerification.vue';
import UrlManager from '@/urlManager'
import EventBus from '@/EventBus'
import errors from '@enum/errorCodesDecoded.esm';
import LoadingSpinner from './LoadingSpinner.vue';

export default {
    components: {
      EmailVerification,
      LoadingSpinner
    },
    data() {
        return {
            form: {
                email: '',
                password: ''
            },
            verification: {
              id: ''
            },
            user: {
                id: ''
            },
            registering: false,
            resetUserIdCallback: '',
            VERIFICATION_ID_LOCAL_STORAGE_NAME: 'VerificationId',
        }
    },
    methods: {
        handleSubmit() {
            console.log('Dati inviati:', this.form);
            this.registering = true;
            fetch(`${UrlManager()}/registeringUsers`, {
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
              return response.json();
            })
            .then(data => {
              if (!data.errorCode)
              {
                this.verification.id = data.id;
                localStorage.setItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME, data.id)
              }else
                alert(errors[data.errorCode])
            }).catch(() =>{
              alert("Network error. Please try again later!")
            }).finally(() => { 
              console.log("Richiesta eseguita.")
              this.registering = false;
            })
        },
        resetLocalStorageVerificationId(){
          localStorage.setItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME, '')
        }
    },
    mounted() {
      this.resetUserIdCallback = () => {
        console.log('resetUserID')
        this.form.email = '';
        this.form.password = '';
        this.verification.id = '';
        this.resetLocalStorageVerificationId()
      };
      EventBus.on('registered', this.resetUserIdCallback)

      if (localStorage.getItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME) == null)
        this.resetLocalStorageVerificationId();
      this.verification.id = localStorage.getItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME)
    }
}
</script>