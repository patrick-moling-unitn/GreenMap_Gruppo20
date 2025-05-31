<template>
    <!-- Modal -->
    <div class="modal fade" id="issueReportModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalLabel">{{ modalTitle }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-3">
              <!-- <span class="input-group-text">Report position</span> -->
              <!-- <p class="form-control m-0">{{ formattedPosition }}</p> -->
              <span class="input-group-text">Latitude: </span>
              <p class="form-control m-0">{{ Number(this.position.lat).toFixed(4) }}</p>
              <span  class="input-group-text">Longitude: </span>
              <p class="form-control m-0">{{ Number(this.position.lng).toFixed(4) }}</p>
            </div>
            <div class="input-group mb-3">
              <label class="input-group-text" for="inputGroupSelect01">Report Type</label>
              <select v-if="mode == 'add'" class="form-select" id="inputGroupSelect01" v-model="report.type">
                <option selected disabled value="">Choose an option...</option>
                <option value="1">Trashcan location suggestion</option>
                <option value="2">Trashcan position missing</option>
                <option value="3">Trash out of place</option>
                <option value="4">Trashcan full</option>
              </select>
              <p v-else class="form-control m-0">{{ report.type }}</p>
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text">Report description</span>
              <textarea v-if="mode == 'add'" class="form-control" aria-label="Short report description" v-model="report.description"></textarea>
              <p v-else class="form-control m-0">{{ report.description }}</p>
            </div>
            <div class="mt-3 mb-0 p-2 alert alert-danger d-flex align-items-center" role="alert" v-if="error">
              <svg xmlns="http://www.w3.org/2000/svg" class="bi flex-shrink-0 me-2 alert-icon" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <div>
                Please select a valid report type and enter a short report description
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="clearReport">Cancel</button>
            <button type="button" class="btn btn-primary" v-if="mode == 'add'" @click="submitReport">Submit</button>
            <button type="button" class="btn btn-success" v-else-if="mode == 'manage'" @click="resolveReport">Resolve</button>
          </div>
        </div>
      </div>
    </div>
</template>

<script template>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import errors from '@enum/errorCodes.esm';

export default{
  data() {
      return {
          report: {
            type: '',
            description: ''
          },
          error: false
      }
  },
  props: {
    mode: String,
    position: JSON,
    formattedPosition: String,
    modalTitle: String,
    recievedReport: JSON,
  },
  mounted(){
    $('#issueReportModal').on('show.bs.modal', () => {
      this.$nextTick(() => {
        this.report.type = this.numberToReportType(this.recievedReport.reportType);
        this.report.description = this.recievedReport.reportDescription;
      });
    });
    $('#issueReportModal').on('hidden.bs.modal', () => {
      $('#map').focus();
    });
  },
  methods: {
    numberToReportType(number) {
      switch (number){
        case 1: return "Trashcan location suggestion"
        case 2: return "Trashcan position missing"
        case 3: return "Trash out of place"
        case 4: return "Trashcan full"
        default: return "Error"
      }
    },
    submitReport(){
      console.log(this.report.type);
      console.log(this.report.description);
      if (!this.report.type || !this.report.description)
        this.error = true;
      else{
        $('#issueReportModal').modal('hide');
        fetch(`${UrlManager()}/reports`, {
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
            alert(errors[response.errorCode])
        });
        this.clearReport();
      }
    },
    resolveReport(){
      alert("Work in progress...")
    },
    clearReport(){
      this.report.description = '';
      this.report.type = '';
      this.error = false;
    }
  }
}
</script>