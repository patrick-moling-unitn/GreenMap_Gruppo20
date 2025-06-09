<template>
    <div class="adaptive-margin-body d-flex flex-wrap gap-2">
    <h2 class="mb-4">Manage Users</h2>
    <div class="container-fluid" style="max-width: 5000px; margin: auto;">
    <table class="table table-bordered table-hover w-100 text-center align-middle">
      <thead class="table-primary">
        <tr>
          <th>Administrator</th>
          <th>Banned</th>
          <th>Email</th>
          <th>Last Report Date</th>
          <th>Points</th>
          <th>Ban/Delete/Promote</th>
        </tr>
      </thead>
      <tbody> 
        <tr>
          <td>
            <select class="form-select" v-model="administrator" @change="showUsers">
                <option :value='""'>All</option>
                <option :value="true">Yes</option>
                <option :value="false">No</option>
            </select></td>
          <td>
            <select class="form-select" v-model="banned" @change="showUsers">
                <option :value='""'>All</option>
                <option :value="true">Yes</option>
                <option :value="false">No</option>
            </select></td>
          <td><input type="text" class="form-control" v-model="email" @input="showUsers" placeholder="write"/></td>
          <td><input type="text" class="form-control" v-model="lastreportdate" @input="showUsers" placeholder="write"/></td>
          <td><input type="text" class="form-control" v-model="points" @input="showUsers" placeholder="write"/></td>
          <td><p>-</p></td>
        </tr>
        <tr v-for="user in users">
          <td>{{ user.administrator }}</td>
          <td>{{ user.banned }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.lastReportIssueDate }}</td>
          <td>{{ user.points }}</td>
          <td>
          <div class="input-group p-0 m-0">
            <button class="btn btn-outline-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Manage user</button>
            <ul class="dropdown-menu">
              <li><button class="dropdown-item btn btn-danger" @click="banUnbanUserWrapper(user.self)">Ban/Unban</button></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item btn btn-danger" @click="deleteUserWrapper(user.self)">Delete</button></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item btn btn-primary" @click="promoteDemoteUser(user.self)">Promote/Demote</button></li>
            </ul>
          </div>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    </div>
</template>
<script template>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import usersFunctions from '@/usersFunctions'
import errors from '@enum/errorCodesDecoded.esm';

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
            fetch(`${UrlManager()}/authenticatedUsers?type=all&administrator=${this.administrator}&banned=${this.banned}&email=${this.email}&lastReportDate=${this.lastReportDate}&points=${this.points}`, {
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
                alert(errors[users.errorCode])
            });
        })
    },
    async deleteUserWrapper(self){
      let userID= self.split("/").pop();
      const {deleteUser} = usersFunctions();
      await deleteUser(userID);
      this.showUsers()
    },
    async banUnbanUserWrapper(self){
        let userID= self.split("/").pop();
        const {banUnbanUser} = usersFunctions();
        await banUnbanUser(userID)
        this.showUsers()
    },
    promoteDemoteUser(self){
        let userID= self.split("/").pop();
        fetch(`${UrlManager()}/authenticatedUsers/${userID}`,{
            method: "PUT",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "x-access-token": TokenManager()
            },
            body: JSON.stringify({
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
  },
  activated(){
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