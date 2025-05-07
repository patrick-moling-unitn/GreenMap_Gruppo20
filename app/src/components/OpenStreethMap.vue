<template>
    <div id="map"></div>
</template>

<script template>
export default {
    data: () => ({
      //......data of your component
    }),
    mounted() {
        let geolocalizedPosition = L.latLng(0,0);
        let geolocalizationSuccess = false;
        let geolocalizationMarket;
        let repeater;

        //const PORT = process.env.SERVER_PORT;

        let trashcanMarkers = [];

        getLocation();

        console.log("creating map options")

        let mapOptions = {
            center:[geolocalizedPosition.lat, geolocalizedPosition.lng],
            zoom:100
        }

        let map = new L.map('map' , mapOptions);

        let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
        map.addLayer(layer);
        
        map.on('moveend', function() {
          var center = map.getCenter();
          console.log("Map center coordinates:", center.lat, center.lng);
          
          showAllTrashcans();
        });

        function getLocation() {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
          } else {
            alert("Geolocation is not supported by this browser.");
          }
        }

        function success(position) {
          console.log("Latitude: " + position.coords.latitude +
          " Longitude: " + position.coords.longitude);
          geolocalizedPosition = L.latLng(position.coords.
            latitude, position.coords.longitude);

          if (!geolocalizationSuccess){
            addNewTrashcan(); //---TEST--- aggiunge un cestino vicino la posizione attuale
            geolocalizationSuccess = true;
            map.panTo(geolocalizedPosition);
          }
          updateCurrentPosition();
          repeater = setTimeout(getLocation, 10000);
        }

        function error() {
          alert("Sorry, no position available.")
        }

        function updateCurrentPosition(){
          if (geolocalizationMarket == null)
            geolocalizationMarket = L.marker(geolocalizedPosition).addTo(map);
          else
            geolocalizationMarket.setLatLng(geolocalizedPosition)
        }

        function showAllTrashcans(){
          fetch(`http://localhost:${3000}/trashcans`)
            .then(response => response.json())
            .then(trashcans => { 
              console.log(trashcans)
              
              let i = 0;
              trashcans.forEach(element => {
                let lat = parseFloat(element.latitude.$numberDecimal);
                let lng = parseFloat(element.longitude.$numberDecimal);
                console.log(trashcanMarkers);
                console.log(trashcanMarkers.length);

                let position = L.latLng(lat, lng);
                if (trashcanMarkers.length > i){
                  let marker = trashcanMarkers[i];
                  marker.setLatLng(position);
                }
                else{
                  let marker = L.marker(position);
                  trashcanMarkers.push(marker);
                  marker.addTo(map);
                }
                i++;
              });

              if (trashcans.length < trashcanMarkers.length){
                for (i=trashcans.length; i<trashcanMarkers.length; i++){
                  trashcanMarkers[i].removeFrom(map);
                }
                trashcanMarkers = trashcanMarkers.slice(trashcans.length);
              }
            });
        }

        function addNewTrashcan(){
          fetch(`http://localhost:${3000}/trashcans`, {
            method: "POST",
            body: JSON.stringify({
              latitude: geolocalizedPosition.lat + (Math.random() - Math.random())/100,
              longitude: geolocalizedPosition.lng + (Math.random() - Math.random())/100,
              trashcanType: 3
            }),
            headers: {
              "Content-type": "application/json; charset=UTF-8"
            }
          });
        }
    },
    methods: {
      //......methods of your component
    }
  }
</script>

<style scoped>
    #map{
        width: 100%;
        height: 100vh;
    }
</style>