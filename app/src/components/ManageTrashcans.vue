<template>
    <button type="button" class="btn btn-primary" @click="getAllTrashcans">Get all trashcans</button>
    <div class="mb-4 d-flex flex-wrap gap-2">
    <h2 class="mb-4">Cestini</h2>
    <div class="container-fluid" style="max-width: 5000px; margin: auto;">
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
    </div>
</template>

<script default>
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import trashcanAPIUtility from '@/trashcanAPIUtility'

export default {
    data() {
      return {
        trashcans: [],
        trashcanTypes: ["Paper","Plastic","Residue","Glass","Organic"]
      }
    },
    methods : {
        getAllTrashcans(){
            console.log('Dati richiesti');
            fetch(`${UrlManager()}/trashcans`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => response.json())
            .then(response => {
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
    },
    activated(){
        this.getAllTrashcans()
    }
}
</script>