<template>
    <div id="map"></div>
</template>

<script template>
export default {
    data: () => ({
      //......data of your component
    }),
    mounted() {
        let mapDiv = document.createElement('div')
        mapDiv.setAttribute('id','map')
        document.body.appendChild(mapDiv)
      
        let mapOptions = {
            center:[51.958, 9.141],
            zoom:100
        }

        let map = new L.map('map' , mapOptions);

        let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
        map.addLayer(layer);
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