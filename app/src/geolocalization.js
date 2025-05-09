let geolocalizationSuccess = false;
let successCallback

function success(position){
    let firstSuccess = geolocalizationSuccess == false;
    successCallback(position, firstSuccess);
    geolocalizationSuccess = true;
}

export default class GeolocalizationManager {
    hasUserLocation(){
        return geolocalizationSuccess;
    }
    getUserLocation(successParam, failureParam){
        if (navigator.geolocation) {
            successCallback = successParam
            navigator.geolocation.getCurrentPosition(success, failureParam);
        } else {
            console.log("Geolocalizzazione non supportata su questo browser");
        }
    }
}