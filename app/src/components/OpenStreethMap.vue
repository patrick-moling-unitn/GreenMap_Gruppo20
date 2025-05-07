<template>
    <div id="map"></div>
</template>

<script template>
export default {
    data: () => ({
      //......data of your component
    }),
    mounted() {
        let geolocalizedPosition = new L.LatLng(0,0);
        let geolocalizationSuccess = false;
        let geolocalizationMarket;
        let repeater;

        getLocation();

        console.log("creating map options")

        let mapOptions = {
            center:[geolocalizedPosition.lat, geolocalizedPosition.lng],
            zoom:100
        }

        let map = new L.map('map' , mapOptions);

        let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
        map.addLayer(layer);

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
          geolocalizedPosition = new L.LatLng(position.coords.
            latitude, position.coords.longitude);

          if (!geolocalizationSuccess){
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