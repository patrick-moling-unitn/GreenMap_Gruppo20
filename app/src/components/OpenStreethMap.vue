<template>
    <div id="map"></div>
</template>

<script template>
import vector2 from "vector2"
export default {
    data: () => ({
      //......data of your component
    }),
    mounted() {
        let geolocalizedPosition = new L.LatLng(0,0);
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
          map.panTo(geolocalizedPosition)
        }

        function error() {
          alert("Sorry, no position available.")
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