<template>
  <form @submit.prevent="verifyCode">
    <p>UserId ricevuto: {{ userId }}</p>
    <input name="code" v-model="this.code" type="text"/>
    <button type="submit">Send Code</button>
  </form>
</template>

<script>
export default {
    data() {
        return {
            code:''
        }
    },
    props: {
        userId: String
    },
    methods: {
        verifyCode() {
            fetch(`http://localhost:${3000}/users/newuser`, {
                method: "POST",
                body: JSON.stringify({
                    id: this.userId,
                    code: this.code
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            }).then(response => {
              if(response.ok)
                alert("Utente creato");
              else
                console.log(response);
            });
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