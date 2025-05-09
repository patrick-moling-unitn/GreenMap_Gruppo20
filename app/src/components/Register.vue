<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="username">Username:</label>
      <input id="username" v-model="form.username" type="text" required />
    </div>

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

  <button @click="showAllUsers">Show All</button>

  <form @submit.prevent="deleteUser">
    <input id="userid" v-model="user.id" type="text"/>
    <button type="submit">Delete User</button>
  </form>
</template>

<script>
export default {
    data() {
        return {
            form: {
                username: '',
                email: '',
                password: ''
            },
            user: {
                id: ''
            }
        }
    },
    methods: {
        
        handleSubmit() {
            console.log('Dati inviati:', this.form);
            fetch(`http://localhost:${3000}/users/newuser`, {
                method: "POST",
                body: JSON.stringify({
                    username: this.form.username,
                    email: this.form.email,
                    password: this.form.password
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            }).then(response => console.log(response));
        },
        showAllUsers(){
            console.log('Dati richiesti');
            fetch(`http://localhost:${3000}/users/allusers`)
            .then(response => response.json())
            .then(users => console.log(users));
        },
        deleteUser(){
            console.log('Dati inviati');
            fetch(`http://localhost:${3000}/users/delete/${this.user.id}`,{
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