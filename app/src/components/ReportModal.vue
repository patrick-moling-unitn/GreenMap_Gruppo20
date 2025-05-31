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
              <p class="form-control m-0 fw-light">{{ Number(this.position.lat).toFixed(4) }}</p>
              <span  class="input-group-text">Longitude: </span>
              <p class="form-control m-0 fw-light">{{ Number(this.position.lng).toFixed(4) }}</p>
            </div>
            <div class="input-group mb-3">
              <label class="input-group-text" for="inputGroupSelect01">Report Type</label>
              <select v-if="mode == 'add'" class="form-select" id="inputGroupSelect01" v-model="report.type">
                <option selected disabled value="">Choose an option...</option>
                <option value="1">{{numberToReportType(1)}}</option>
                <option value="2">{{numberToReportType(2)}}</option>
                <option value="3">{{numberToReportType(3)}}</option>
                <option value="4">{{numberToReportType(4)}}</option>
              </select>
              <p v-else class="form-control m-0 fw-light">{{ report.type }}</p>
            </div>
            <div class="input-group mb-3">
              <span class="input-group-text">Report description</span>
              <textarea v-if="mode == 'add'" class="form-control" aria-label="Short report description" v-model="report.description"></textarea>
              <p v-else class="form-control m-0 fw-light">{{ report.description }}</p>
            </div>
            <div v-if="mode == 'manage'">
              <div class="input-group mb-3">
                <label class="input-group-text" for="inputGroupSelect02">Resolution Mode</label>
                <select class="form-select" id="inputGroupSelect02" v-model="resolutionType">
                  <option selected disabled value="">Choose an option...</option>
                  <option value="resolve">Resolve and reward user</option>
                  <option value="delete">Delete report</option>
                  <option value="ban">Ban user</option>
                </select>
              </div>
              <div v-if="foundSmartResolutionMethod() && resolutionType == 'resolve'" class="input-group mb-3">
                <span class="input-group-text bg-success text-white">Smart resolution found</span>
                <p class="form-control m-0 fw-light">{{ smartResolutionMode }}</p>
              </div>
            </div>
            <AlertMessage v-if="mode == 'add'" :showMessage="error" :message="'Please select a valid report type and enter a short report description'"></AlertMessage>
            <AlertMessage v-else :showMessage="error" :message="'Please select a valid resolution mode'"></AlertMessage>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="clearReport">Cancel</button>
            <button type="button" class="btn btn-primary" v-if="mode == 'add'" @click="submitReport">Submit</button>
            <button type="button" class="btn btn-success" v-else-if="mode == 'manage'" @click="handleReportResolution">Resolve</button>
          </div>
        </div>
      </div>
    </div>
</template>

<script template>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import errors from '@enum/errorCodes.esm';
import AlertMessage from './AlertMessage.vue'
import usersFunctions from '@/usersFunctions'
import reportAPIUtility from '@/reportAPIUtility'
import trashcanAPIUtility from '@/trashcanAPIUtility'
import { TrashcanType, TrashcanTypeStringValue } from '@enum/trashcanType.ems.js'
import { ReportType, ReportTypeStringValue } from '@enum/reportType.ems.js'

export default{
  components: {
    AlertMessage
  },
  data() {
      return {
          report: {
            type: '',
            description: ''
          },
          smartResolutionMode: '',
          resolutionType: '',
          error: false,
          trashcanTypeStringValues: [TrashcanTypeStringValue.PAPER, TrashcanTypeStringValue.PLASTIC, 
            TrashcanTypeStringValue.RESIDUE, TrashcanTypeStringValue.GLASS, TrashcanTypeStringValue.ORGANIC]
      }
  },
  props: {
    mode: String,
    position: JSON,
    formattedPosition: String,
    modalTitle: String,
    recievedReport: JSON,
    onUpdatedCallback: '',
    onAddedTrashcanCallback: ''
  },
  mounted(){
    $('#issueReportModal').on('show.bs.modal', () => {
      this.$nextTick(() => {
        if (this.recievedReport){
          this.report.type = this.numberToReportType(this.recievedReport.reportType);
          this.report.description = this.recievedReport.reportDescription;
        }
      });
    });
    $('#issueReportModal').on('hidden.bs.modal', () => {
      $('#map').focus();
    });
  },
  methods: {
    getTrashcanTypeFromDescription(reportDescription){
      let trashcanTypeFound;
      for (let i=0; i < this.trashcanTypeStringValues.length && !trashcanTypeFound; i++){
        if (reportDescription.includes(this.trashcanTypeStringValues[i].toLowerCase())) 
          trashcanTypeFound = this.trashcanTypeStringValues[i];
      }
      return trashcanTypeFound;
    },
    foundSmartResolutionMethod(){
      if (this.numberToReportType(this.recievedReport.reportType) == "Trashcan position missing")
      {
        let reportDescription = this.recievedReport.reportDescription.toLowerCase(), 
            trashcanTypeFound = this.getTrashcanTypeFromDescription(reportDescription);
        
        if (trashcanTypeFound){
          this.smartResolutionMode = "Add new '"+trashcanTypeFound+"' trashcan"
          return true;
        }
      }
      return false;
    },
    trashcanNameToNumber(name){
      return this.trashcanTypeStringValues.indexOf(name)
    },
    executeSmartResolutionMethod(){
      if (this.foundSmartResolutionMethod()){
        let resolutionMode = this.smartResolutionMode.split("'"),
            method = resolutionMode[0].toLowerCase(),
            item = resolutionMode[1];

        if (method.startsWith("add")){
          let trashcan = {
              trashcanType: this.trashcanNameToNumber(item),
              latitude: this.recievedReport.latitude.$numberDecimal,
              longitude: this.recievedReport.longitude.$numberDecimal,
          }
          trashcanAPIUtility.addTrashcan(trashcan, this.onAddedTrashcanCallback);
        }
      }
    },
    numberToReportType(number) {
      switch (number){
        case ReportType.TRASHCAN_LOCATION_SUGGESTION: return ReportTypeStringValue.TRASHCAN_LOCATION_SUGGESTION
        case ReportType.TRASHCAN_POSITION_MISSING: return ReportTypeStringValue.TRASHCAN_POSITION_MISSING
        case ReportType.TRASH_OUT_OF_PLACE: return ReportTypeStringValue.TRASH_OUT_OF_PLACE
        case ReportType.TRASHCAN_FULL: return ReportTypeStringValue.TRASHCAN_FULL
        default: return "Error"
      }
    },
    submitReport(){
      console.log(this.report.type);
      console.log(this.report.description);

      if (!this.report.type || !this.report.description)
        this.error = true;
      else {
        let hasToInsertTrashcanType = this.report.type == 
          ReportType.TRASHCAN_POSITION_MISSING, trashcanTypeFound;
        if (hasToInsertTrashcanType){
          let reportDescription = this.report.description.toLowerCase();
              trashcanTypeFound = this.getTrashcanTypeFromDescription(reportDescription);
        }
        if (hasToInsertTrashcanType && !trashcanTypeFound){
          let message = "Please insert the trashcan type missing in the description (",
              trashcanTypes = this.trashcanTypeStringValues;
          trashcanTypes.forEach(trashcanType => { 
            message += trashcanType 
            if (trashcanType != trashcanTypes[trashcanTypes.length - 1])
              message += ", "
          });
          message += ")"
          alert(message)
        }else
          this.fetchReportSubmission();
      }
    },
    hideModal(){
        $('#issueReportModal').modal('hide');
    },
    fetchReportSubmission(){
        this.hideModal();
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
    },
    handleReportResolution(){
      if(this.resolutionType){
        let reportId = this.recievedReport._id;
        switch (this.resolutionType){
          case "resolve": this.resolveReport(reportId); break;
          case "delete": this.deleteReport(reportId); break;
          case "ban": this.banUserWrapper(issuerId); break;
          default: alert("Please enter a valid resolution method");
        }
      }else
        this.error = true;
    },
    invokeUpdateCallback(){
        this.onUpdatedCallback();
        this.hideModal();
    },
    resolveReport(reportId){
      this.executeSmartResolutionMethod();
      reportAPIUtility.resolveReport(reportId, this.invokeUpdateCallback); //to add: callback
    },
    deleteReport(reportId){
      reportAPIUtility.deleteReport(reportId, this.invokeUpdateCallback); //to add: callback
    },
    async banUserWrapper(issuerId){
        const {banUnbanUser} = usersFunctions();
        await banUnbanUser(issuerId)
    },
    clearReport(){
      this.smartResolutionMode = '';
      this.resolutionType = '';
      this.report.description = '';
      this.report.type = '';
      this.error = false;
    }
  }
}
</script>