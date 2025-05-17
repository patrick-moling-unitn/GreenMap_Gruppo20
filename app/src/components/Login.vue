<template>
  <div>
    <h1>Login using existing account</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email:</label>
        <input id="email" v-model="form.email" type="email" required />
      </div>

      <div>
        <label for="password">Password:</label>
        <input id="password" v-model="form.password" type="password" required />
      </div>

      <button type="submit">Login</button>
    </form>

    <button @click="deleteAllUsers">Delete All Authenticated Users</button>
    <button @click="showAllUsers">Show All Authenticated Users</button>
  </div>
</template>

<script>
import EventBus from '@/EventBus';
import ApiManager from '@/apiManager'
export default {
    data() {
        return {
            form: {
                email: '',
                password: ''
            }
        }
    },
    methods: {
        handleSubmit() {
            console.log('Dati inviati:', this.form);
            fetch(`http://localhost:${3000}${ApiManager()}/login`, {
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
            });
        },
        showAllUsers(){
            console.log('Dati richiesti');
            fetch(`http://localhost:${3000}${ApiManager()}/login`)
            .then(response => response.json())
            .then(users => console.log(users));
        },
        deleteAllUsers(){
          console.log('Dati inviati');
            fetch(`http://localhost:${3000}${ApiManager()}/login`,{
                method: "DELETE",
            })
            .then(response => console.log(response));
        }
    },
    mounted() {
        //
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