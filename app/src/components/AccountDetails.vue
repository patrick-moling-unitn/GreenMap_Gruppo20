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
                    <h2 v-else>No reports to show</h2>
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
                    <div class="form-check form-switch d-flex justify-content-center align-items-center gap-2">
                        <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" v-model="hasCookieConsent" @change="updateCookieConsent">
                        <label class="form-check-label" for="switchCheckDefault">Accept cookies</label>
                        <CookiePopup v-if="askForCookie"/>
                    </div>
                    <button type="button" class=" mb-2 btn btn-danger" @click="confirmAction('Sei sicuro di voler eliminare l\'utente?', () => deleteUserWrapper(accountId))">Delete your account</button>
                </div>
                <div class="p-4">
                    <div class="border mb-2 p-2">
                    <strong>YOUR CODES</strong>
                    </div>
                    <div class="mb-4 flex-wrap gap-2">
                        <DiscountsTable :access="'personal'" :admin="false" :accountId="accountId"/>
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
import usersFunctions from '@/usersFunctions'
import EventBus from '@/EventBus'
import CookiePopup from './CookiePopup.vue'
import DiscountsTable from './DiscountsTable.vue'

const COOKIES_CONSENT_LOCAL_STORAGE_NAME = "CookiesConsent"

export default{
  components: {
    CookiePopup,
    DiscountsTable
  },
  props: {
    accountId:String
  },
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
          MAX_POINTS: 5000,
          hasCookieConsent: localStorage.getItem(COOKIES_CONSENT_LOCAL_STORAGE_NAME),
          askForCookie:false
      }
  },
  methods: {
    confirmAction(message, onConfirm) {
        if (window.confirm(message))
            onConfirm()
    },
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
        fetch(`${UrlManager()}/authenticatedUsers?type=personal`, {
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
    },
    async deleteUserWrapper(userId){
        const {deleteUser} = usersFunctions();
        await deleteUser(userId)
        EventBus.emit('loggedout');
    },
    updateCookieConsent(){
        if(!this.hasCookieConsent)
            EventBus.emit('cookieConsentUpdated', false)
        else
            this.askForCookie=true
    },
    syncCookieConsent(){
        this.hasCookieConsent= localStorage.getItem(COOKIES_CONSENT_LOCAL_STORAGE_NAME) ==='true'
        this.askForCookie=false
        if(this.hasCookieConsent){
            //devo creare un nuovo cookie con l'authtoken dell'utente
        }
    }
  },
  created() {
    EventBus.on('cookieConsentUpdated', this.syncCookieConsent);
  },
  beforeUnmount() {
    EventBus.off('cookieConsentUpdated', this.syncCookieConsent);
  },
  mounted(){
    this.getPersonalReports()
    this.getPersonalData()
  }
}
</script>