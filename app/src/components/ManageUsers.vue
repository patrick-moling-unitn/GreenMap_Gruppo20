<template>
    <div class="mb-4 d-flex flex-wrap gap-2">
    <h2 class="mb-4">utenti</h2>
    <div class="container-fluid" style="max-width: 5000px; margin: auto;">
    <table class="table table-bordered table-hover w-100 text-center align-middle">
      <thead class="table-primary">
        <tr>
          <th>Administrator</th>
          <th>Banned</th>
          <th>Email</th>
          <th>Last Report Date</th>
          <th>Points</th>
          <th>Ban</th>
          <th>Delete</th>
          <th>Promote</th>
        </tr>
      </thead>
      <tbody> 
        <tr>
          <td>
            <select class="form-select" v-model="administrator" @change="showUsers">
                <option :value='""'>Tutti</option>
                <option :value="true">Sì</option>
                <option :value="false">No</option>
            </select></td>
          <td>
            <select class="form-select" v-model="banned" @change="showUsers">
                <option :value='""'>Tutti</option>
                <option :value="true">Sì</option>
                <option :value="false">No</option>
            </select></td>
          <td><input type="text" class="form-control" v-model="email" @input="showUsers" placeholder="write"/></td>
          <td><input type="text" class="form-control" v-model="lastreportdate" @input="showUsers" placeholder="write"/></td>
          <td><input type="text" class="form-control" v-model="points" @input="showUsers" placeholder="write"/></td>
          <td><p>-</p></td>
          <td><p>-</p></td>
          <td><p>-</p></td>
        </tr>
        <tr v-for="user in users">
          <td>{{ user.administrator }}</td>
          <td>{{ user.banned }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.lastReportIssueDate }}</td>
          <td>{{ user.points }}</td>
          <td><button type="button" class="btn btn-danger" @click="banUnbanUser(user.email)">Ban/Unban</button></td>
          <td><button type="button" class="btn btn-danger" @click="deleteUser(user.email)">Delete</button></td>
          <td><button type="button" class="btn btn-success" @click="promoteDemoteUser(user.email)">Promote/Demote</button></td>
        </tr>
      </tbody>
    </table>
    </div>
    </div>
</template>
<script template>
import TokenManager from '@/tokenManager'
import ApiManager from '@/apiManager'
export default{
  data() {
      return {
        administrator: '',
        banned: '',
        email:'',
        lastReportDate: '',
        points: '',
        users: []
      }
  },
  mounted(){
    this.showUsers();
  },
  methods: {
    showUsers(){
        this.$nextTick(() => {
            console.log('Dati richiesti');
            fetch(`http://localhost:${3000}${ApiManager()}/authenticatedUsers?administrator=${this.administrator}&banned=${this.banned}&email=${this.email}&lastReportDate=${this.lastReportDate}&points=${this.points}`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => response.json())
            .then(users => {
              if(users){
                console.log(users)
                this.users=users
              }
              else
                return
            });
        })
    },
    deleteUser(userEmail){
        console.log('Dati inviati');
        fetch(`http://localhost:${3000}${ApiManager()}/authenticatedUsers`,{
            method: "DELETE",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            },
            body: JSON.stringify({
                email: userEmail,
            })
        })
        .then(response => console.log(response))
        .then(() => this.showUsers());
    },
    banUnbanUser(userEmail){
        console.log('Dati inviati');
        fetch(`http://localhost:${3000}${ApiManager()}/authenticatedUsers`,{
            method: "PUT",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            },
            body: JSON.stringify({
                email: userEmail,
                editAdmin: false,
                editBan: true
            })
        })
        .then(response => console.log(response))
        .then(() => this.showUsers());
    },
    promoteDemoteUser(userEmail){
        console.log('Dati inviati');
        fetch(`http://localhost:${3000}${ApiManager()}/authenticatedUsers`,{
            method: "PUT",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            },
            body: JSON.stringify({
                email: userEmail,
                editAdmin: true,
                editBan: false
            })
        })
        .then(response => console.log(response))
        .then(() => this.showUsers());
    }
  },
  mounted(){
    this.showUsers()
  }
}
</script>
<style scoped>
th, td {
  min-width: 150px;
  word-break: break-word;
}
</style>