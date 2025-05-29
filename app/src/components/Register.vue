<template>
  <EmailVerification v-if="this.verification.id" :userId="this.verification.id"/>
  <div v-else>
    <h1>Register new account</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email:</label>
        <input id="email" v-model="form.email" type="email" required />
      </div>

      <div>
        <label for="password">Password:</label>
        <input id="password" v-model="form.password" type="password" required />
      </div>

      <button type="submit">Registrati</button>
    </form>

    <button @click="deleteAllUsers">Delete All Registering User</button>
    <button @click="showAllUsers">Show All Registering User</button>

    <form @submit.prevent="deleteUser">
      <input id="userid" v-model="user.id" type="text"/>
      <button type="submit">Delete User</button>
    </form>
  </div>
</template>

<script>
import EmailVerification from './EmailVerification.vue';
import UrlManager from '@/urlManager'
import EventBus from '@/EventBus'
export default {
    components: {
      EmailVerification
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
            VERIFICATION_ID_LOCAL_STORAGE_NAME: 'VerificationId',
        }
    },
    methods: {
        handleSubmit() {
            console.log('Dati inviati:', this.form);
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
              if (!response.ok) {
                console.log("Errore nella risposta:", response);
                alert("Errore nelle credenziali");
                return;
              }
              return response.json();
            })
            .then(data => {
              if (data)
              {
                this.verification.id = data.id;
                localStorage.setItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME, data.id)
              }
            }).finally(() => { console.log("Richiesta eseguita.") })
        },
        showAllUsers(){
            console.log('Dati richiesti');
            fetch(`${UrlManager()}/registeringUsers`)
            .then(response => response.json())
            .then(users => console.log(users));
        },
        deleteUser(){
            console.log('Dati inviati');
            fetch(`${UrlManager()}/registeringUsers/${this.user.id}`,{
                method: "DELETE",
            })
            .then(response => console.log(response));
        },
        deleteAllUsers(){
          console.log('Dati inviati');
            fetch(`${UrlManager()}/registeringUsers`,{
                method: "DELETE",
            })
            .then(response => console.log(response));
        },
        resetLocalStorageVerificationId(){
          localStorage.setItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME, '')
        }
    },
    mounted() {
      EventBus.on('registered', () => {
        console.log('resetUserID')
        this.form.email = '';
        this.form.password = '';
        this.verification.id = '';
        this.resetLocalStorageVerificationId();
      })

      if (localStorage.getItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME) == null)
        this.resetLocalStorageVerificationId();
      this.verification.id = localStorage.getItem(this.VERIFICATION_ID_LOCAL_STORAGE_NAME)
    }
}
</script>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  max-width: 300px;
}

div {
  margin-bottom: 1rem;
}

label {
  font-weight: bold;
}

input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

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