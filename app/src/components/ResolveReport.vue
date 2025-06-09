<template class="flex-div">
  <div class="adaptive-margin-body">
    <h1>Manage Reports</h1>
    <div class="mt-4 p-4">
    <LoadingSpinner v-if="requestRunning"></LoadingSpinner>
    <div class="d-flex" v-else>
      <button type="button" class="btn btn-primary" @click="getAllReports">Get all reports</button>
      <button type="button" class="ms-4 btn btn-danger" @click="deleteAllReports">Delete all reports</button>
    </div>
    <div class="container p-0" v-if="this.reports.length > 0">
    <h3 class="mt-4">Recieved reports</h3>
    <table class="table table-bordered table-hover">
      <thead class="table-primary">
        <tr>
          <th>Issuer ID</th>
          <th>Tipo</th>
          <th>Descrizione</th>
          <th>Latitudine</th>
          <th>Longitudine</th>
          <th>Risolto</th>
          <th>Risolvi</th>
        </tr>
      </thead>
      <tbody> 
        <tr v-for="report in reports">
          <td>{{ report.issuerId }}</td>
          <td>{{ reportTypes[report.reportType]}}</td>
          <td style="max-width: 200px; word-wrap: break-word; white-space: normal;">{{ report.reportDescription }}</td>
          <td>{{ parseFloat(report.latitude?.$numberDecimal).toFixed(2)  }}</td>
          <td>{{ parseFloat(report.longitude?.$numberDecimal).toFixed(2)  }}</td>
          <td>{{ report.resolved ? 'Sì' : 'No' }}</td>
          <td>
            <select class="form-select w-100 p-3" id="button-addon" v-model="selectedReportType[report.self]">
              <option selected disabled value="">Resolution type...</option>
              <option value="resolve">Reward user</option>
              <option value="delete">Delete report</option>
              <option value="ban">Ban user</option>
            </select>
            <button class="btn btn-outline-success" type="button" id="button-addon" @click="handleRowReportResolution(report.self, report.issuerId)">Resolve</button>
          </td>
        </tr>
      </tbody>
    </table>
    </div>
    <h5 class="mt-4" v-else-if="!requestRunning">No reports issued</h5>
    </div>
  </div>
</template>

<style>
  .flex-div {
    display: flex;
    flex-direction: column;
  }
</style>

<script template>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import usersFunctions from '@/usersFunctions'
import errors from '@enum/errorCodesDecoded.esm';
import reportAPIUtility from '@/reportAPIUtility'
import LoadingSpinner from './LoadingSpinner.vue';

export default{
  components: {
    LoadingSpinner
  },
  data() {
      return {
          selectedReportType: {},
          reports: [],
          reportTypes: {
            '1': "Trashcan location suggestion",
            '2': "Trashcan position missing",
            '3': "Trash out of place",
            '4': "Trashcan full"
          },
          requestRunning: false,
      }
  },
  methods: {
    handleRowReportResolution(self, issuerId){
        console.log(self)
        let reportId= self.split("/").pop();
        if(this.selectedReportType[self])
          switch (this.selectedReportType[self]){
            case "resolve": this.resolveReport(reportId); break;
            case "delete": this.deleteReport(reportId); break;
            case "ban": this.banUserWrapper(issuerId); this.deleteUserWrapper(issuerId); break;
            default: alert("Please enter a valid resolution method");
          }
        else
          alert("Please enter a valid resolution method");
    },
    resolveReport(reportId){
      reportAPIUtility.resolveReport(reportId, this.getAllReports);
    },
    deleteReport(reportId){
      reportAPIUtility.deleteReport(reportId, this.getAllReports);
    },
    async banUserWrapper(issuerId){
        const {banUnbanUser} = usersFunctions();
        await banUnbanUser(issuerId)
        this.showUsers()
    },
    //Wrapper perso, per errore, durante il merge del commit #474b6e321d6370ade32e0f4ab020fc7c18435053
    //[lavoro di Matteo, commit: 92903c73b76a091cdbe400d58d9b7760cb09856e]
    async deleteUserWrapper(self){ 
      const {deleteUser} = usersFunctions();
      await deleteUser(self);
      this.showUsers()
    },
    deleteAllReports(){
      this.requestRunning = true;
      fetch(`${UrlManager()}/reports?type=all`, {
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
          alert(errors[response.errorCode])
      }).catch(() =>{
        alert("Network error. Please try again later!")
      }).finally(() => {
        this.requestRunning = false;
      });
    },
    getAllReports(){
      this.requestRunning = true;
      fetch(`${UrlManager()}/reports?type=all`, {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      })
      .then(response => response.json())
      .then(response => { 
        if (!response.errorCode){
          console.log("Got all reports: ")
          console.log(response)
          this.reports = response;
        }else
          alert(errors[response.errorCode])
      }).catch(() =>{
        alert("Network error. Please try again later!")
      }).finally(() => {
        this.requestRunning = false;
      });
    },
  },
  mounted(){
    this.getAllReports()
  }
}
</script>