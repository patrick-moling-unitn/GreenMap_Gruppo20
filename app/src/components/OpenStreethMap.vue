<template>
    <div id="map"></div>
    <button type="button" class="btn btn-secondary" @click="getAllReports">Get all reports TEST</button>
    <button type="button" class="btn btn-secondary" @click="getPersonalReports">Get personal reports TEST</button>
    <!-- Modal -->
    <div class="modal fade" id="issueReportModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Issue Report</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Report position: {{ formattedReportPosition }}</p>
            <div class="input-group mb-3">
              <label class="input-group-text" for="inputGroupSelect01">Report Type</label>
              <select class="form-select" id="inputGroupSelect01" v-model="report.type">
                <option selected disabled value="">Choose an option...</option>
                <option value="1">Trashcan location suggestion</option>
                <option value="2">Trashcan position missing</option>
                <option value="3">Trash out of place</option>
                <option value="4">Trashcan full</option>
              </select>
            </div>
            <div class="input-group">
              <span class="input-group-text">Short report description</span>
              <textarea class="form-control" aria-label="Short report description" v-model="report.description"></textarea>
            </div>
            <div class="alert alert-danger" role="alert" v-if="error">
              Please select a valid report type and enter a short report description
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" @click="clearReport">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitReport">Submit</button>
          </div>
        </div>
      </div>
    </div>
</template>

<script template>
import GeolocalizationManager from '../geolocalization';
import { onActivated, onDeactivated } from 'vue'
import TokenManager from '@/tokenManager'
import ApiManager from '@/apiManager'

export default
{
  data() {
      return {
          reportPosition: {
            lat: '',
            lng: ''
          },
          report: {
            type: '',
            description: ''
          },
          error: false,
          formattedReportPosition: ''
      }
  },
  methods: {
    getPersonalReports(){
        fetch(`http://localhost:${3000}${ApiManager()}/reports?type=personal`, {
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        });
    },
    getAllReports(){
        fetch(`http://localhost:${3000}${ApiManager()}/reports?type=all`, {
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        })
        .then(response => response.json())
        .then(reports => { 
          console.log("Got all reports: ")
          console.log(reports)
        });
    },
    submitReport(){
      console.log(this.report.type);
      console.log(this.report.description);
      if (!this.report.type || !this.report.description)
        this.error = true;
      else{
        $('#issueReportModal').modal('hide');
        fetch(`http://localhost:${3000}${ApiManager()}/reports`, {
          method: "POST",
          body: JSON.stringify({
            reportType: this.report.type,
            reportDescription: this.report.description,
            latitude: this.reportPosition.lat,
            longitude: this.reportPosition.lng
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            "x-access-token": TokenManager()
          }
        }).then(response => {
          if (response.ok)
            alert("Report issued!")
        });
        this.clearReport();
      }
    },
    clearReport(){
      this.report.description = '';
      this.report.type = '';
      this.error = false;
    }
  },
  mounted()
  {
    const MAX_TRASHCAN_VIEW_DISTANCE = 1_000;
    const TRASHCAN_UPDATE_INTERVAL_MS = 500;
    const GPS_UPDATE_INTERVAL_MS = 10_000;
    
    const DEBUGGING_CONSOLE_LEVEL = 1; //1: min; 2: mid; 3: high
    const TEST_MODE = false;    
    
    const TrashType = Object.freeze({
        PAPER: 0,
        PLASTIC: 1,
        RESIDUE: 2,
        GLASS: 3,
        ORGANIC: 4
    });

    const paperBinIcon = L.icon({
      iconUrl: './paper-bin-icon.png',
      shadowUrl: './recycle-bin-hardshadow.png',
      iconSize: [35, 35],
      shadowSize: [35, 35]
    }),
    plasticBinIcon = L.icon({
      iconUrl: './plastic-bin-icon.png',
      shadowUrl: './recycle-bin-shadow.png',
      iconSize: [35, 35],
      shadowSize: [35, 35]
    }),
    residueBinIcon = L.icon({
      iconUrl: './residue-bin-icon.png',
      iconSize: [35, 35]
    }),
    glassBinIcon = L.icon({
      iconUrl: './glass-bin-icon.png',
      shadowUrl: './recycle-bin-shadow.png',
      iconSize: [35, 35],
      shadowSize: [35, 35]
    }),
    organicBinIcon = L.icon({
      iconUrl: './organic-bin-icon.png',
      shadowUrl: './recycle-bin-shadow.png',
      iconSize: [35, 35],
      shadowSize: [35, 35]
    });

    /*const myModal = document.getElementById('myModal')
    const myInput = document.getElementById('myInput')

    myModal.addEventListener('shown.bs.modal', () => {
      myInput.focus()
    })*/

    let geolocalizationManager = new GeolocalizationManager();
    let geolocalizationMarker;
    let requestRepeater; //fai si che il garbage collector non uccida la set timeout

    let trashcansCached;
    let lastTrashcanUpdateTime = -1;

    let trashcanMarkers = [];

    let mapOptions = {
      center:[50, 50],
      zoom:100
    }

    let map = new L.map('map' , mapOptions);

    let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
    map.addLayer(layer);

    requestUserLocation();

    map.on('move', function() {
      let time = new Date().getTime();
      if (lastTrashcanUpdateTime + TRASHCAN_UPDATE_INTERVAL_MS < time)
      {
        lastTrashcanUpdateTime = time
        var center = map.getCenter();
        if (DEBUGGING_CONSOLE_LEVEL >= 1) console.log("Move");
            
        showAllTrashcans(center);
      }
    }); 
    
    map.on('click', (event) => {
      console.log("Map clicked: " + event.latlng)
      this.reportPosition.lat = event.latlng.lat
      this.reportPosition.lng = event.latlng.lng
      this.formattedReportPosition = "{ "+event.latlng.lat.toFixed(4) + ", " + event.latlng.lng.toFixed(4)+" }"
      $('#issueReportModal').modal('show');
    });

    map.on('moveend', function() {
        var center = map.getCenter();
        if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("Map center coordinates:", center.lat, center.lng);
            
        requestAllTrashcans(center);
    });

    onActivated(() => {
      requestUserLocation();
    })

    onDeactivated(() => {
      if (requestRepeater) clearTimeout(requestRepeater);
    })

    function requestUserLocation(){
      geolocalizationManager.getUserLocation(success, failure);
    }

    function success(position, firstSuccess) {
      if (DEBUGGING_CONSOLE_LEVEL >= 1) console.log("Geolocalization successful; "+
        "Latitude: " + position.coords.latitude + " Longitude: " + position.coords.longitude);
      let geolocalizedPosition = L.latLng(position.coords.latitude, position.coords.longitude);

      if (firstSuccess){
        showAllTrashcans(geolocalizedPosition);
        map.panTo(geolocalizedPosition);
      }

      if (TEST_MODE) addNewTrashcan(geolocalizedPosition); //---TEST--- aggiunge un cestino vicino la posizione attuale

      updateCurrentPosition(geolocalizedPosition);
      requestRepeater = setTimeout(requestUserLocation, GPS_UPDATE_INTERVAL_MS);
    }

    function failure() {
      alert("Attiva la geolocalizzazione e aggiorna la pagina per visualizzare la tua posizione attuale sulla mappa")
    }

    function updateCurrentPosition(geolocalizedPosition){
      if (geolocalizationMarker == null)
        geolocalizationMarker = L.marker(geolocalizedPosition).addTo(map);
      else
        geolocalizationMarker.setLatLng(geolocalizedPosition)
    }

    function requestAllTrashcans(currentPosition){
      fetch(`http://localhost:${3000}${ApiManager()}/trashcans`) //`http://localhost:${3000}/trashcans/`+currentPosition
        .then(response => response.json())
        .then(trashcans => { 
          if (DEBUGGING_CONSOLE_LEVEL >= 1) console.log("Get all trashcans")
          trashcansCached = trashcans
      });
    }

    function showAllTrashcans(currentPosition){
      if (DEBUGGING_CONSOLE_LEVEL >= 3) console.log(trashcansCached)
             
      let visibleTrashcanCount = 0;
      if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("in " + trashcanMarkers.length);
      if (trashcansCached != null && trashcansCached.length > 0){
        visibleTrashcanCount = trashcansCached.length;
        let i = 0;
        
        trashcansCached.forEach(element => {
          let lat = parseFloat(element.latitude.$numberDecimal);
          let lng = parseFloat(element.longitude.$numberDecimal);

          let position = L.latLng(lat, lng);
                
          if (DEBUGGING_CONSOLE_LEVEL >= 3) console.log(position.distanceTo(currentPosition));
          if (position.distanceTo(currentPosition) < MAX_TRASHCAN_VIEW_DISTANCE){
            let marker;
            if (trashcanMarkers.length > i){
              marker = trashcanMarkers[i];
              marker.setLatLng(position);
            }
            else{
              marker = L.marker(position);
              trashcanMarkers.push(marker);
              marker.addTo(map);
            }
            switch (element.trashcanType){
              case TrashType.PAPER: marker.setIcon(paperBinIcon); break;
              case TrashType.PLASTIC: marker.setIcon(plasticBinIcon); break;
              case TrashType.RESIDUE: marker.setIcon(residueBinIcon); break;
              case TrashType.GLASS: marker.setIcon(glassBinIcon); break;
              case TrashType.ORGANIC: marker.setIcon(organicBinIcon); break;
              default: console.warn("Funzionalità non implementata! (type: "+element.trashcanType+")");
            }

            i++;
          }else
            visibleTrashcanCount--;
        });
      }
      if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("visible " + visibleTrashcanCount);
      
      let j = 0;
      if (visibleTrashcanCount < trashcanMarkers.length){
        for (j=visibleTrashcanCount; j<trashcanMarkers.length; j++){
          trashcanMarkers[j].removeFrom(map);
        }
        trashcanMarkers = trashcanMarkers.slice(0, visibleTrashcanCount);
      }
      if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("out " + trashcanMarkers.length);
    }

    function randomIntFromInterval(min, max) { // massimo e minimo inclusi
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function addNewTrashcan(geolocalizedPosition){
      fetch(`http://localhost:${3000}${ApiManager()}/trashcans`, {
        method: "POST",
        body: JSON.stringify({
          latitude: geolocalizedPosition.lat + (Math.random() - Math.random())/100,
          longitude: geolocalizedPosition.lng + (Math.random() - Math.random())/100,
          trashcanType: randomIntFromInterval(TrashType.PAPER, TrashType.ORGANIC)
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          "x-access-token": TokenManager()
        }
      });
    }
  },
}
</script>

<style scoped>
    #map{
      width: 100vh;
      height: 100vh;
    }
</style>