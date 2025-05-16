<template>
    <div id="map"></div>
</template>

<script template>
import GeolocalizationManager from '../geolocalization';
import { onActivated, onDeactivated } from 'vue'

export default
{
  mounted()
  {
    const MAX_TRASHCAN_VIEW_DISTANCE = 1_000;
    const TRASHCAN_UPDATE_INTERVAL_MS = 500;
    const GPS_UPDATE_INTERVAL_MS = 10_000;
    
    const DEBUGGING_CONSOLE_LEVEL = 1; //1: min; 2: mid; 3: high
    const TEST_MODE = true;    
    
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
        if (TEST_MODE) addNewTrashcan(geolocalizedPosition); //---TEST--- aggiunge un cestino vicino la posizione attuale
        showAllTrashcans(geolocalizedPosition);
        map.panTo(geolocalizedPosition);
      }

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
      fetch(`http://localhost:${3000}/trashcans`) //`http://localhost:${3000}/trashcans/`+currentPosition
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
      fetch(`http://localhost:${3000}/trashcans`, {
        method: "POST",
        body: JSON.stringify({
          latitude: geolocalizedPosition.lat + (Math.random() - Math.random())/100,
          longitude: geolocalizedPosition.lng + (Math.random() - Math.random())/100,
          trashcanType: randomIntFromInterval(TrashType.PAPER, TrashType.ORGANIC)
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
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