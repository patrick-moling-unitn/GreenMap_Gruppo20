<template>
    <IssueReport :position="this.reportPosition" :formattedPosition="this.formattedReportPosition"></IssueReport>
    <div id="map"></div>
    <div class="d-flex" style="align-items: center;">
      <div class="input-group" style="padding: 5px; max-width: 350px">
        <select class="form-select" id="button-addon" v-model="selectedTrashcanType">
          <option selected disabled value="">Trashcan type...</option>
          <option value="0">Paper trashcan</option>
          <option value="1">Plastic trashcan</option>
          <option value="2">Residue trashcan</option>
          <option value="3">Glass trashcan</option>
          <option value="4">Organic trashcan</option>
        </select>
        <button class="btn btn-outline-primary" type="button" id="button-addon" @click="searchClosestTrashcan">Find</button>
      </div>
      <button class="btn btn-primary" type="button" v-if="this.geolocalized" 
        @click="showGPSposition">Show GPS position</button>
    </div>
</template>

<script template>
import GeolocalizationManager from '../geolocalization';
import { onActivated, onDeactivated } from 'vue'
import TokenManager from '@/tokenManager'
import ApiManager from '@/apiManager'
import IssueReport from './IssueReport.vue'

export default
{
  components: {
    IssueReport
  },
  data() {
      return {
          reportPosition: {
            lat: '',
            lng: ''
          },
          formattedReportPosition: '',
          selectedTrashcanType: '',
          currentPosition: {
            lat: '',
            lng: ''
          },
          searchTrashcanCallback: '',
          showGPSPositionCallback: '',
          geolocalized: false
      }
  },
  methods: {
    searchClosestTrashcan() {
      if (!this.selectedTrashcanType){
        alert("Seleziona un tipo di cestino da ricercare!")
      }else{
        fetch(`http://localhost:${3000}${ApiManager()}/trashcans/${this.currentPosition.lat},${this.currentPosition.lng}
             ?type=${this.selectedTrashcanType}`)
          .then(response => {
            if (!response.ok)
              alert("Nessun cestino del tipo selezionato trovato nelle vicinanze.");
            else
              return response.json();
          })
          .then(trashcan => { 
            if (trashcan){
              this.searchTrashcanCallback(trashcan)
            }
        });
      }
    },
    showGPSposition() {
      this.showGPSPositionCallback();
    }
  },
  mounted()
  {
    const MAX_TRASHCAN_VIEW_DISTANCE = 1_000;
    const TRASHCAN_UPDATE_INTERVAL_MS = 500;
    const GPS_UPDATE_INTERVAL_MS = 10_000;
    
    const DEBUGGING_CONSOLE_LEVEL = 1; //1: min; 2: mid; 3: high
    const TEST_MODE = false;    
    
    const SELF = this;

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

    let closestTrashcanHighlighter;

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

    //NON E' PIU NECESSARIO (O ALMENO SEMBRA) PERCHE' I CESTINI VENGONO AGGIORNATI QUANDO LA MAPPA VIENE LASCIATA
    /*map.on('move', function() { 
      let time = new Date().getTime();
      if (lastTrashcanUpdateTime + TRASHCAN_UPDATE_INTERVAL_MS < time)
      {
        lastTrashcanUpdateTime = time
        var center = map.getCenter();
        if (DEBUGGING_CONSOLE_LEVEL >= 1) console.log("Move");
            
        showAllTrashcans(center);
      }
    });*/
    
    map.on('click', (event) => {
      console.log("Map clicked: " + event.latlng)
      this.reportPosition.lat = event.latlng.lat
      this.reportPosition.lng = event.latlng.lng
      this.formattedReportPosition = "{ "+event.latlng.lat.toFixed(4) + ", " + event.latlng.lng.toFixed(4)+" }"
      $('#issueReportModal').modal('show');
    });
    
    map.on('moveend', () => {
        var center = map.getCenter();
        this.currentPosition.lat = center.lat;
        this.currentPosition.lng = center.lng
        if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("Map center coordinates:", center.lat, center.lng);
            
        requestAllTrashcans();
    });

    this.searchTrashcanCallback = (trashcan) => {
      console.log(trashcan);
      if (closestTrashcanHighlighter == null)
        closestTrashcanHighlighter = L.popup();

      let position = L.latLng(trashcan.latitude.$numberDecimal, trashcan.longitude.$numberDecimal)

      closestTrashcanHighlighter.setLatLng(position)
      .setContent('<p>This is the closest trashcan.</p>')
      .openOn(map);

      map.flyTo(position);
    }

    this.showGPSPositionCallback = () => {
      if (geolocalizationMarker)
        map.flyTo(geolocalizationMarker.getLatLng())
    }

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
        SELF.geolocalized = true
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

    function requestAllTrashcans(){
      fetch(`http://localhost:${3000}${ApiManager()}/trashcans/${SELF.currentPosition.lat},${SELF.currentPosition.lng}
             ?distance=${MAX_TRASHCAN_VIEW_DISTANCE}`)
        .then(response => response.json())
        .then(trashcans => { 
          if (DEBUGGING_CONSOLE_LEVEL >= 1) console.log("Get all trashcans from current position")
          console.log(trashcans)
          trashcansCached = trashcans
          showAllTrashcans(SELF.currentPosition)
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
      width: 80vh;
      height: 80vh;
    }
</style>