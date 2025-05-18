<template>
    <div>
      <button type="button" class="btn btn-danger" @click="deleteAllReports">Delete all reports TEST</button>
      <button type="button" class="btn btn-primary" @click="getAllReports">Get all reports TEST</button>
      <button type="button" class="btn btn-secondary" @click="getPersonalReports">Get personal reports TEST</button>
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
    
    <!-- Modal -->
    <div class="modal fade" id="issueReportModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalLabel">Issue Report</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Report position: {{ formattedPosition }}</p>
            <div class="input-group mb-3">
              <label class="input-group-text" for="inputGroupSelect01">Report Type</label>
              <select class="form-select" id="inputGroupSelect01" v-model="report.type">
                <option selected disabled value="">Choose an option...</option>
                <option value="1">Trashcan location suggestion</option>
                <option value="2">Trashcan position missing</option>
                <option value="3">Trash out of place</option>
                <option value="4">Trashcan full</option>
              </select>
            </div>
            <div class="input-group">
              <span class="input-group-text">Short report description</span>
              <textarea class="form-control" aria-label="Short report description" v-model="report.description"></textarea>
            </div>
            <div class="alert alert-danger d-flex align-items-center" role="alert" v-if="error">
              <svg xmlns="http://www.w3.org/2000/svg" class="bi flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <div>
                Please select a valid report type and enter a short report description
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="clearReport">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitReport">Submit</button>
          </div>
        </div>
      </div>
    </div>
</template>

<script template>
import TokenManager from '@/tokenManager'
import ApiManager from '@/apiManager'
export default{
  data() {
      return {
          report: {
            type: '',
            description: ''
          },
          error: false,
          selectedId: '',
          selectedResolutionType: ''
      }
  },
  props: {
    position: JSON,
    formattedPosition: String
  },
  methods: {
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
          if (response.ok)
            alert("Report resolved!")
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
          if (response.ok)
            console.log("Deleted report!")
          else
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
        if (response.ok)
          console.log("User banned!")
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
        if (response.ok)
          console.log("Deleted all user reports!")
        else
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
        if (response.ok)
          console.log("Deleted all reports!")
        else
          return response.json()
      })
      .then(response => { 
        if (response)
          alert(response.message)
      });
    },
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
        }else
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
        }else
          alert(response.message)
      });
    },
    submitReport(){
      console.log(this.report.type);
      console.log(this.report.description);
      if (!this.report.type || !this.report.description)
        this.error = true;
      else{
        $('#issueReportModal').modal('hide');
        fetch(`http://localhost:${3000}${ApiManager()}/reports`, {
          method: "POST",
          body: JSON.stringify({
            type: this.report.type,
            description: this.report.description,
            latitude: this.position.lat,
            longitude: this.position.lng
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => {
          if (response.ok)
            alert("Report issued!")
          else
            return response.json()
        })
        .then(response => {
          if (response)
            alert(response.message)
        });
        this.clearReport();
      }
    },
    clearReport(){
      this.report.description = '';
      this.report.type = '';
      this.error = false;
    }
  }
}
</script>