<template class="flex-div">
    <div class="container-fluid">
        <div class="row" style="height: 100vh;">
        <!-- Colonna Sinistra -->
            <div class="col-md-6 border-end d-flex flex-column p-3">
                <div class="border mb-2 p-2">
                <strong>YOUR REPORTS</strong>
                </div>
                <div class="mb-4 flex-wrap gap-2">
                    <div>
                        <button type="button" class="btn btn-secondary" @click="getPersonalReports">Update personal reports</button>
                    </div>
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
                <div class="border mb-2 p-4 text-center">
                <h2>Your points</h2>
                <button type="button" class="btn btn-secondary" @click="getPersonalPoints">Update personal points</button>
                <p>{{this.points}}</p>
                </div>
                <div class="flex-fill border"></div>
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
          points: "",
          reports: [],
          reportTypes: {
            '1': "Trashcan location suggestion",
            '2': "Trashcan position missing",
            '3': "Trash out of place",
            '4': "Trashcan full"
          }
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
    getPersonalPoints(){
        fetch(`${UrlManager()}/authenticatedUsers`, {
            method: "GET",
            headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
            }
        }).then(response => response.json())
        .then(response => { 
            if (!response.error){
            this.points = response.points;
            }else
            alert(response.message)
        });
    }
  },
  mounted(){
    this.getPersonalReports()
    this.getPersonalPoints()
  }
}
</script>