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
                <p v-else class="form-control m-0">{{ Number(this.position.lat).toFixed(4) }}</p>
                <span  class="input-group-text">Longitude: </span>
                <input v-if="mode == 'add'" id="longitudeInput" type="text" class="form-control" v-model="this.position.lng" placeholder="Longitude" aria-label="Longitude">
                <p v-else class="form-control m-0">{{ Number(this.position.lng).toFixed(4) }}</p>
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
            <div class="mt-3 mb-0 p-2 alert alert-danger d-flex align-items-center" role="alert" v-if="error">
              <svg xmlns="http://www.w3.org/2000/svg" class="bi flex-shrink-0 me-2 alert-icon" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              <div>
                Please select a valid trashcan type and position
              </div>
            </div>
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

import trashcanAPIUtility from '@/trashcanAPIUtility'

export default{
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
        fetch(`${UrlManager()}/trashcans`, {
          method: "POST",
          body: JSON.stringify(trashcan),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => {
          if (response.ok){
            EventBus.emit("trashcanAdded")
            console.log("Trashcan added!")
          }
          else
            return response.json()
        })
        .then(response => {
          if (response)
            alert(response.message)
        });
        this.clearModal();
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