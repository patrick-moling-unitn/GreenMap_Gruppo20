<template class="flex-div">
    <div class="container-fluid">
        <div class="row" style="height: 100vh;">
        <!-- Colonna Sinistra -->
            <div class="col-md-6 border-end d-flex flex-column p-3">
                <div class="border mb-2 p-2">
                <strong>YOUR REPORTS</strong>
                </div>
                <div class="mb-4 flex-wrap gap-2">
                    <div class="table-responsive" v-if="this.reports.length > 0">
                    <table class="table table-bordered table-hover">
                    <thead class="table-primary">
                        <tr>
                        <th>Tipo</th>
                        <th>Descrizione</th>
                        <th>Latitudine</th>
                        <th>Longitudine</th>
                        <th>Risolto</th>
                        </tr>
                    </thead>
                    <tbody> 
                        <tr v-for="report in reports">
                        <td>{{ reportTypes[report.reportType]}}</td>
                        <td style="max-width: 200px; word-wrap: break-word; white-space: normal;">{{ report.reportDescription }}</td>
                        <td>{{ parseFloat(report.latitude?.$numberDecimal).toFixed(2) }}</td>
                        <td>{{ parseFloat(report.longitude?.$numberDecimal).toFixed(2) }}</td>
                        <td>{{ report.resolved ? 'Sì' : 'No' }}</td>
                        </tr>
                    </tbody>
                    </table>
                    </div>
                    <h2 v-else>Nessun report da mostrare</h2>
                </div>
            </div>
            <!-- Colonna Destra -->
            <div class="col-md-6 d-flex flex-column p-3">
                <!-- Sezione punti -->
                <div class="border rounded p-4 text-center">
                    <strong>YOUR POINTS</strong>
                    <p class="display-6 fw-semibold mb-0">{{ user.points }}</p>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar bg-success" role="progressbar" :style="{ width: user.points*100/this.MAX_POINTS + '%' }" :aria-valuenow="user.points" aria-valuemin="0" aria-valuemax="5000">
                        {{ user.points*100/this.MAX_POINTS }}%
                        </div>
                    </div>
                </div>

                <!-- Sezione account -->
                <div class="border rounded p-4 text-center">
                    <strong>YOUR ACCOUNT</strong>
                    <div class="text-center">
                    <p class="mb-2"><strong>Email:</strong> {{ user.email }}</p>
                    <p class="mb-0">
                        <strong>Last Report:</strong> {{ user.lastReportIssueDate || 'N/A' }}
                    </p>
                    </div>
                </div>
            </div>
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
export default{
  data() {
      return {
          user: {points:"", email:"", lastReportIssueDate: ""},
          reports: [],
          reportTypes: {
            '1': "Trashcan location suggestion",
            '2': "Trashcan position missing",
            '3': "Trash out of place",
            '4': "Trashcan full"
          },
          MAX_POINTS: 5000
      }
  },
  methods: {
    getPersonalReports(){
        fetch(`${UrlManager()}/reports?type=personal`, {
            method: "GET",
            headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
            }
        }).then(response => response.json())
        .then(response => { 
            if (!response.error){
            this.reports = response;
            }else
            alert(response.message)
        });
    },
    getPersonalData(){
        fetch(`${UrlManager()}/authenticatedUsers`, {
            method: "GET",
            headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
            }
        }).then(response => response.json())
        .then(response => { 
            if (!response.error){
            this.user.points = response.points
            this.user.email = response.email
            this.user.lastReportIssueDate = response.lastReportIssueDate
            }else
            alert(response.message)
        });
    }
  },
  mounted(){
    this.getPersonalReports()
    this.getPersonalData()
  },
  activated(){
    this.getPersonalReports()
    this.getPersonalData()
  }
}
</script>