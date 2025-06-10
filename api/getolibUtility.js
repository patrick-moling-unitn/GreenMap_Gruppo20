const geolib = require("geolib");

class GeolibUtility {
    filterClosestElementsOnList(list, position, maxDistance){
        return list.filter(element => {
            let elementPosition = {
                latitude: parseFloat(element.latitude),
                longitude: parseFloat(element.longitude)
            }
            return this.distance(position, elementPosition) < maxDistance;
        });
    }
    areLatLngValid(lat, lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    latLngToJSON(lat, lng){
        return {
            latitude: lat,
            longitude: lng
        }
    }
    distance(startPosition, endPosition){
        return geolib.getDistance(startPosition, endPosition);
    }
}

const geolibUtility = new GeolibUtility();

module.exports = geolibUtility;