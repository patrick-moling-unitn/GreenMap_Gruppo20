<template>
    <!-- Modal -->
    <div class="modal fade" id="addTrashcanModal" tabindex="-1" aria-labelledby="modalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalLabel">{{ modalTitle }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="input-group mb-3">
                <span class="input-group-text">Latitude: </span>
                <input v-if="mode == 'add'" id="latitudeInput" type="text" class="form-control" v-model="this.position.lat" placeholder="Latitude" aria-label="Latitude">
                <p v-else class="form-control m-0 fw-light">{{ Number(this.position.lat).toFixed(4) }}</p>
                <span  class="input-group-text">Longitude: </span>
                <input v-if="mode == 'add'" id="longitudeInput" type="text" class="form-control" v-model="this.position.lng" placeholder="Longitude" aria-label="Longitude">
                <p v-else class="form-control m-0 fw-light">{{ Number(this.position.lng).toFixed(4) }}</p>
            </div>
            <div class="input-group mb-3">
              <label class="input-group-text" for="inputGroupSelect01">Trashcan Type</label>
              <select class="form-select" id="inputGroupSelect01" v-model="trashcanType">
                <option selected disabled value="">Choose an option...</option>
                <option value="0">Paper</option>
                <option value="1">Plastic</option>
                <option value="2">Residue</option>
                <option value="3">Glass</option>
                <option value="4">Organic</option>
              </select>
            </div>
            <AlertMessage :showMessage="error" :message="'Please select a valid trashcan type and position'"></AlertMessage>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="clearModal">Cancel</button>
            <button type="button" class="btn btn-primary" v-if="mode == 'add'" @click="addTrashcan">Submit</button>
            <div v-else-if="mode == 'manage'">
              <button type="button" class="btn btn-danger me-2" @click="this.deleteTrashcan()">Delete</button>
              <button type="button" class="btn btn-success" @click="this.updateTrashcan()">Update</button>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script template>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import EventBus from '@/EventBus'
import AlertMessage from './AlertMessage.vue'
import trashcanAPIUtility from '@/trashcanAPIUtility'

export default{
  components: {
    AlertMessage
  },
  data() {
      return {
          trashcanType: '',
          error: false
      }
  },
  props: {
    mode: String,
    position: JSON,
    formattedPosition: String,
    modalTitle: String,
    recievedTrashcan: JSON,
    onUpdatedCallback: ''
  },
  mounted(){
    $('#addTrashcanModal').on('show.bs.modal', () => {
      this.$nextTick(() => {
        $('latitudeInput').value = this.position.lat;
        $('longitudeInput').value = this.position.lng;
        if (this.recievedTrashcan)
          this.trashcanType = this.recievedTrashcan.trashcanType;
      });
    });
    $('#addTrashcanModal').on('hidden.bs.modal', () => {
      $('#map').focus();
    });
  },
  methods: {
    hideModal(){
        $('#addTrashcanModal').modal('hide');
    },
    onTrashcanAdded() {
      EventBus.emit("trashcanAdded")
      this.clearModal();
    },
    addTrashcan(){
      if (!this.trashcanType || isNaN(this.position.lat) || isNaN(this.position.lng)) // || !this.trashcan.description)
        this.error = true;
      else{
        this.hideModal();

        let trashcan = {
            trashcanType: this.trashcanType,
            latitude: this.position.lat,
            longitude: this.position.lng
        }
        trashcanAPIUtility.addTrashcan(trashcan, this.onTrashcanAdded);
      }
    },
    invokeUpdateCallback(){
        this.onUpdatedCallback();
        this.hideModal();
    },
    deleteTrashcan(){
      let id = this.recievedTrashcan._id
      trashcanAPIUtility.deleteTrashcan(id, this.invokeUpdateCallback);
    },
    updateTrashcan(){
      let id = this.recievedTrashcan._id
      trashcanAPIUtility.updateTrashcan(id, this.trashcanType, this.invokeUpdateCallback);
    },
    clearModal(){
      this.trashcanType = '';
      this.error = false;
    }
  }
}
</script>