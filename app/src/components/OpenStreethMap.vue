<template>
    <TrashcanModal :onUpdatedCallback="trashcanModal.updatedCallback" :recievedTrashcan="trashcanModal.selectedItem" :mode="trashcanModal.mode" :modalTitle="trashcanModal.title" :position="this.mapClickPosition" :formattedPosition="this.formattedReportPosition"></TrashcanModal>
    <ReportModal :onAddedTrashcanCallback="trashcanModal.updatedCallback" :onUpdatedCallback="reportModal.updatedCallback" :recievedReport="reportModal.selectedItem" :mode="reportModal.mode" :modalTitle="reportModal.title" :position="this.mapClickPosition" :formattedPosition="this.formattedReportPosition"></ReportModal>
    <div id="map" tabindex="0"></div>
    <div class="d-flex align-items-center">
      <LoadingSpinner v-if="searchingForTrashcan"></LoadingSpinner>
      <div v-else class="input-group" style="padding: 5px; max-width: 350px">
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
      <button id="showGPSPosition" class="btn btn-primary ms-4" type="button" v-if="this.geolocalized" 
        @click="showGPSposition">Show GPS position</button>
    </div>
</template>

<script template>
import GeolocalizationManager from '../geolocalization';
import { onActivated, onDeactivated } from 'vue'
import TokenManager from '@/tokenManager'
import UrlManager from '@/urlManager'
import ReportModal from './ReportModal.vue'
import EventBus from '@/EventBus'
import TrashcanModal from './TrashcanModal.vue';
import errors from '@enum/errorCodesDecoded.esm';
import { TrashcanType } from '@enum/trashcanType.esm.js'
import LoadingSpinner from './LoadingSpinner.vue';

export default
{
  name: 'OpenStreethMap',
  components: {
    ReportModal,
    TrashcanModal,
    LoadingSpinner
  },
  props: {
    admin: false
  },
  data() {
      return {
          trashcanModal: {
            mode: '',
            title: '',
            selectedItem: '',
            updatedCallback: ''
          },
          reportModal: {
            mode: '',
            title: '',
            selectedItem: '',
            updatedCallback: ''
          },
          mapClickPosition: {
            lat: '',
            lng: ''
          },
          formattedReportPosition: '',
          selectedTrashcanType: '',
          currentPosition: {
            lat: '',
            lng: ''
          },
          searchingForTrashcan: false,
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
        this.searchingForTrashcan = true;
        fetch(`${UrlManager()}/trashcans/${this.currentPosition.lat},${this.currentPosition.lng}
             ?type=${this.selectedTrashcanType}`)
          .then(response => {
            if (!response.ok)
              //alert("Nessun cestino del tipo selezionato trovato nelle vicinanze.");
              alert(errors[response.errorCode])
            else
              return response.json();
          })
          .then(trashcan => { 
            if (trashcan){
              this.searchTrashcanCallback(trashcan)
            }
        }).catch(() =>{
          alert("Network error. Please try again later!")
        }).finally(() => {
          this.searchingForTrashcan = false;
        });
      }
    },
    showGPSposition() {
      this.showGPSPositionCallback();
    },
    setFormattedJSONPosition(lat, lng){
      this.mapClickPosition.lat = lat
      this.mapClickPosition.lng = lng
      this.formattedReportPosition = "{ "+Number(lat).toFixed(4) + ", " + Number(lng).toFixed(4)+" }"
    },
    updateModalData(modal, title, item, mode){
      modal.selectedItem = item;
      modal.title = title;
      modal.mode = mode;
    }
  },
  mounted()
  {
    const MAX_TRASHCAN_VIEW_DISTANCE = 1_000;
    const MAX_REPORT_VIEW_DISTANCE = 1_000;

    const TRASHCAN_UPDATE_INTERVAL_MS = 500;
    const GPS_UPDATE_INTERVAL_MS = 10_000;
    
    const DEBUGGING_CONSOLE_LEVEL = 1; //1: min; 2: mid; 3: high
    const TEST_MODE = false;    
    
    const SELF = this;

    this.trashcanModal.updatedCallback = requestAllTrashcans;
    this.reportModal.updatedCallback = requestAllReports;

    const reportIcon = L.icon({
      iconUrl: './report-icon.png',
      iconSize: [30, 30],
    }),
    paperBinIcon = L.icon({
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

    let reportsCached;
    let reportMarkers = [];

    let trashcansCached;
    let trashcanMarkers = [];

    let mapOptions = {
      center:[46.0662, 11.1256],
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
      this.updateModalData(this.trashcanModal, "Add trashcan", null, "add")
      this.updateModalData(this.reportModal, "Issue report", null, "add")
      this.setFormattedJSONPosition(event.latlng.lat, event.latlng.lng)

      if (this.admin) $('#addTrashcanModal').modal('show');
      else $('#issueReportModal').modal('show');
    });
    
    map.on('moveend', () => {
        var center = map.getCenter();
        this.currentPosition.lat = center.lat;
        this.currentPosition.lng = center.lng
        if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("Map center coordinates:", center.lat, center.lng);
            
        requestAllTrashcans();
        if (this.admin) requestAllReports();
    });

    
    EventBus.on("trashcanAdded", requestAllTrashcans)

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
      fetch(`${UrlManager()}/trashcans/${SELF.currentPosition.lat},${SELF.currentPosition.lng}
             ?distance=${MAX_TRASHCAN_VIEW_DISTANCE}`)
        .then(response => response.json())
        .then(trashcans => { 
          if (DEBUGGING_CONSOLE_LEVEL >= 1) console.log("Get all trashcans from current position")
          trashcansCached = trashcans
          trashcanMarkers = showAll(trashcansCached, trashcanMarkers)
      });
    }

    function requestAllReports(){
      fetch(`${UrlManager()}/reports?position=${SELF.currentPosition.lat},${SELF.currentPosition.lng}
              &distance=${MAX_REPORT_VIEW_DISTANCE}&solved=${false}`, {
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
              "x-access-token": TokenManager()
            }
        })
        .then(response => response.json())
        .then(reports => { 
          if (DEBUGGING_CONSOLE_LEVEL >= 1) console.log("Get all reports from current position")
          reportsCached = reports
          reportMarkers = showAll(reportsCached, reportMarkers)
      });
    }

    function showTrashcanInfoPanel(index) {
      let trashcan = trashcansCached[index];
      SELF.setFormattedJSONPosition(trashcan.latitude.
        $numberDecimal, trashcan.longitude.$numberDecimal)
      SELF.updateModalData(SELF.trashcanModal, "Manage trashcan", trashcan, "manage")
      $('#addTrashcanModal').modal('show');
      console.log(index + " showTrashcanInfoPanel")
    }

    function showReportInfoPanel(index) {
      let report = reportsCached[index];
      SELF.setFormattedJSONPosition(report.latitude.
        $numberDecimal, report.longitude.$numberDecimal)
      SELF.updateModalData(SELF.reportModal, "Manage report", report, "manage")
      $('#issueReportModal').modal('show');
      console.log(index + " showReportInfoPanel")
    }

    function showAll(chachedItemList, markerList){
      if (DEBUGGING_CONSOLE_LEVEL >= 3) console.log(chachedItemList)
             
      let visibleItemCount = 0;
      if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("in " + markerList.length);
      if (chachedItemList != null && chachedItemList.length > 0){
        visibleItemCount = chachedItemList.length;
        let i = 0;
        
        let trashcanList = chachedItemList == trashcansCached;
        chachedItemList.forEach(element => {
          let lat = parseFloat(element.latitude.$numberDecimal);
          let lng = parseFloat(element.longitude.$numberDecimal);

          let position = L.latLng(lat, lng);
          let marker;
          if (markerList.length > i){
            marker = markerList[i];
            marker.setLatLng(position);
          }
          else{
            marker = L.marker(position);
            markerList.push(marker);
            marker.addTo(map);

            if (SELF.admin) {
              let index = i
              marker.on("click", trashcanList ? () => showTrashcanInfoPanel(index) : () => showReportInfoPanel(index))
            }
          }
          if (trashcanList){
            switch (element.trashcanType){
              case TrashcanType.PAPER: marker.setIcon(paperBinIcon); break;
              case TrashcanType.PLASTIC: marker.setIcon(plasticBinIcon); break;
              case TrashcanType.RESIDUE: marker.setIcon(residueBinIcon); break;
              case TrashcanType.GLASS: marker.setIcon(glassBinIcon); break;
              case TrashcanType.ORGANIC: marker.setIcon(organicBinIcon); break;
              default: console.warn("Funzionalità non implementata! (type: "+element.trashcanType+")");
            }
          }
          else
            marker.setIcon(reportIcon);

          i++;
        });
      }
      if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("visible " + visibleItemCount);
      
      let j = 0;
      if (visibleItemCount < markerList.length){
        for (j=visibleItemCount; j<markerList.length; j++){
          markerList[j].removeFrom(map);
        }
        markerList = markerList.slice(0, visibleItemCount);
      }
      if (DEBUGGING_CONSOLE_LEVEL >= 2) console.log("out " + markerList.length);
      return markerList;
    }

    function randomIntFromInterval(min, max) { // massimo e minimo inclusi
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function addNewTrashcan(geolocalizedPosition){
      fetch(`${UrlManager()}/trashcans`, {
        method: "POST",
        body: JSON.stringify({
          latitude: geolocalizedPosition.lat + (Math.random() - Math.random())/100,
          longitude: geolocalizedPosition.lng + (Math.random() - Math.random())/100,
          trashcanType: randomIntFromInterval(TrashcanType.PAPER, TrashcanType.ORGANIC)
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