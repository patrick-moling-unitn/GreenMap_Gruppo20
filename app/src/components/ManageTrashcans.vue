<template>
    <div class="adaptive-margin-body">
    <h1>Manage Trashcans</h1>

    <div class="p-4 mt-4">
    <LoadingSpinner v-if="requestRunning"></LoadingSpinner>
    <div class="d-flex" v-else>
      <button type="button" class="btn btn-primary" @click="getAllTrashcans">Get all trashcans</button>
      <button type="button" class="ms-4 btn btn-danger" @click="deleteAllTrashcans">Delete all trashcans</button>
    </div>

    <div class="container-fluid p-0 mt-4" v-if="this.trashcans.length > 0">
    <h3>Trashcans</h3>
    <table class="table table-bordered table-hover w-100 text-center align-middle">
      <thead class="table-primary">
        <tr>
          <th>Tipo</th>
          <th>Latitudine</th>
          <th>Longitudine</th>
          <th>Cancella</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="trashcan in trashcans">
          <td>{{ trashcan.trashcanType }}</td>
          <td>{{ trashcan.latitude }}</td>
          <td>{{ trashcan.longitude }}</td>
          <td><button type="button" class="btn btn-danger" @click="deleteTrashcan(trashcan.id)">Delete</button></td>
        </tr>
      </tbody>
    </table>
    </div>
    <h5 class="mt-4" v-else-if="!requestRunning">No trashcans on the map. Click on a point on the map to add one!</h5>
    </div>
    </div>  
</template>

<script default>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import trashcanAPIUtility from '@/trashcanAPIUtility'
import LoadingSpinner from './LoadingSpinner.vue'
import errors from '@enum/errorCodesDecoded.esm';

export default {
    components: {
      LoadingSpinner
    },
    data() {
      return {
        trashcans: [],
        trashcanTypes: ["Paper","Plastic","Residue","Glass","Organic"],
        requestRunning: false,
      }
    },
    methods : {
        getAllTrashcans(){
            console.log('Dati richiesti');
            this.requestRunning = true;
            fetch(`${UrlManager()}/trashcans`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => response.json())
            .then(response => {
                if (!response.errorCode){
                this.trashcans = []
                response.forEach((element) => {
                    let resourceUrl = element.self.split('/');
                    let trashcan = {
                        id: resourceUrl[resourceUrl.length-1],
                        trashcanType: this.trashcanTypes[element.trashcanType],
                        latitude: Number(element.latitude.$numberDecimal).toFixed(4),
                        longitude: Number(element.latitude.$numberDecimal).toFixed(4)
                    }
                    this.trashcans.push(trashcan);
                });
                }else
                  alert(errors[response.errorCode])
            }).catch(() =>{
              alert("Network error. Please try again later!")
            }).finally(() => {
              this.requestRunning = false;
            });
        },
        deleteAllTrashcans(){
            console.log('Cancellazione richiesta');
            this.requestRunning = true;
            fetch(`${UrlManager()}/trashcans`, {
                method: "DELETE",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => response.json())
            .then(response => {
              if (response && response.errorCode)
                alert(errors[response.errorCode])
            }).catch(() =>{
              alert("Network error. Please try again later!")
            }).finally(() => {
              this.requestRunning = false;
            });
        },
        updateTrashcanList(removedTrashcanId) {
            this.trashcans = this.trashcans.filter(element => {
                if (element.id != removedTrashcanId)
                    return element;
            });
        },
        deleteTrashcan(trashcanId){
            console.log("delete: "+trashcanId)
            trashcanAPIUtility.deleteTrashcan(trashcanId, () => this.updateTrashcanList(trashcanId));
        }
    },
    mounted(){
        this.getAllTrashcans()
    }
}
</script>