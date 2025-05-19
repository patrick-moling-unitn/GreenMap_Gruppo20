<template>
  <div class="mb-4 d-flex flex-wrap gap-2">
    <div>
      <button type="button" class="btn btn-danger" @click="deleteAllReports">Delete all reports</button>
      <button type="button" class="btn btn-primary" @click="getAllReports">Get all reports</button>
      <button type="button" class="btn btn-secondary" @click="getPersonalReports">Get personal reports</button>
      <div class="input-group mb-3" style="padding: 5px;">
        <input type="text" class="form-control" v-model="selectedId" placeholder="Resolve report [id]" aria-label="Resolve report" aria-describedby="button-addon">
        <select class="form-select" id="button-addon" v-model="selectedResolutionType">
          <option selected disabled value="">Resolution type...</option>
          <option value="resolve">Reward user</option>
          <option value="delete">Delete report</option>
          <option value="ban">Ban user</option>
        </select>
        <button class="btn btn-outline-success" type="button" id="button-addon" @click="handleReportResolution">Resolve</button>
      </div>
    </div>
    <div class="container" v-if="this.reports.length > 0">
    <h2 class="mb-4">Report ricevuti</h2>
    <table class="table table-bordered table-hover">
      <thead class="table-primary">
        <tr>
          <th>Issuer ID</th>
          <th>Tipo</th>
          <th>Descrizione</th>
          <th>Latitudine</th>
          <th>Longitudine</th>
          <th>Risolto</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody> 
        <tr v-for="report in reports">
          <td>{{ report.issuerId }}</td>
          <td>{{ report.reportType }}</td>
          <td>{{ report.reportDescription }}</td>
          <td>{{ report.latitude?.$numberDecimal }}</td>
          <td>{{ report.longitude?.$numberDecimal }}</td>
          <td>{{ report.resolved ? 'Sì' : 'No' }}</td>
          <td><a :href="report.self" class="btn btn-sm btn-outline-primary">Vai</a></td>
        </tr>
      </tbody>
    </table>
    </div>
    <h2 v-else>Nessun report da mostrare</h2>
  </div>
</template>
<script template>
import TokenManager from '@/tokenManager'
import ApiManager from '@/apiManager'
export default{
  data() {
      return {
          selectedId: '',
          selectedResolutionType: '',
          reports: []
      }
  },
  methods: {
    getPersonalReports(){
      fetch(`http://localhost:${3000}${ApiManager()}/reports?type=personal`, {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      }).then(response => response.json())
      .then(response => { 
        if (!response.error){
          console.log("Got personal reports: ")
          console.log(response)
          this.reports = response;
        }else
          alert(response.message)
      });
    },
    handleReportResolution(){
        console.log(this.selectedId)
        switch (this.selectedResolutionType){
          case "resolve": this.resolveReport(); break;
          case "delete": this.deleteReport(); break;
          case "ban": this.banUser(); this.deleteUserReports(); break;
          default: alert("Please enter a valid resolution method");
        }
    },
    resolveReport(){
      fetch(`http://localhost:${3000}${ApiManager()}/reports/${this.selectedId}`, {
          method: "PUT",
          body: JSON.stringify({
            resolved: true
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => {
          if (response.ok){
            alert("Report resolved!")
            this.getAllReports()
          }
          else
            return response.json()
        })
        .then(response => { 
          if (response)
            alert(response.message)
        });
    },
    deleteReport(){
        fetch(`http://localhost:${3000}${ApiManager()}/reports/${this.selectedId}?type=report`, {
          method: "DELETE",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => {
          if (response.ok){
            console.log("Deleted report!");
            this.getAllReports()
          }else
            return response.json()
        })
        .then(response => { 
          if (response)
            alert(response.message)
        });
    },
    banUser(){
      fetch(`http://localhost:${3000}${ApiManager()}/login/${this.selectedId}`, {
        method: "PUT",
        body: JSON.stringify({
          banned: true
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      })
      .then(response => {
        if (response.ok){
          console.log("User banned!")
          this.getAllReports();
        }
        else
          return response.json()
      })
      .then(response => { 
        if (response)
          alert(response.message)
      });
    },
    deleteUserReports(){
      fetch(`http://localhost:${3000}${ApiManager()}/reports/${this.selectedId}?type=userReports`, {
        method: "DELETE",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      })
      .then(response => {
        if (response.ok){
          console.log("Deleted all user reports!");
          this.getAllReports();
        }else
          return response.json()
      })
      .then(response => { 
        if (response)
          alert(response.message)
      });
    },
    deleteAllReports(){
      fetch(`http://localhost:${3000}${ApiManager()}/reports`, {
        method: "DELETE",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      })
      .then(response => {
        if (response.ok){
          console.log("Deleted all reports!");
          this.getAllReports()
        }else
          return response.json()
      })
      .then(response => { 
        if (response)
          alert(response.message)
      });
    },
    getAllReports(){
      fetch(`http://localhost:${3000}${ApiManager()}/reports?type=all`, {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      })
      .then(response => response.json())
      .then(response => { 
        if (!response.error){
          console.log("Got all reports: ")
          console.log(response)
          this.reports = response;
        }else
          alert(response.message)
      });
    },
  }
}
</script>