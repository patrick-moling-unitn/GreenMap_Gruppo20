const express = require('express');
const Trashcan = require('../models/trashcan');
const router = express.Router();

router.get("/", async (req, res) => {
    console.log("get all trashcans request")
    let trashcanList = await Trashcan.find({});
    trashcanList = trashcanList.map((trashcan) => {
        return {
            self: '/trashcans/' + trashcan.id,
            latitude: trashcan.latitude,
            longitude: trashcan.longitude,
            trashcanType: trashcan.trashcanType
        };
    });
    res.status(200).json(trashcanList);
});

router.get("/:position", async (req, res) => {
    console.log(req.params.position)
    let trashcanList = await Trashcan.find({});
    let finalList = []
    console.log("start: "+trashcanList)
    trashcanList.forEach(element => {
        let lat = parseFloat(element.latitude.$numberDecimal);
        let lng = parseFloat(element.longitude.$numberDecimal);

        let trashcanPosition; // = L.latLng(lat, lng); Leaflet non è definita qui!
        // if (req.params.position.distanceTo(trashcanPosition) < 1000) distanceTo non è definita qui!
        finalList.push(element)
    });
    console.log("finalList: "+finalList)
    res.status(200).json(finalList);
});

router.post("",  async (req, res) => {
    console.log("post trashcan request from user "+req.loggedUser.email)

	let trashcan = new Trashcan({
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        trashcanType: req.body.trashcanType
    });
    
	trashcan = await trashcan.save();
    
    let trashcanId = trashcan._id;

    console.log('Trashcan saved successfully');

    res.location("trashcans/" + trashcanId).status(201).send();
});

router.delete('/:id', async (req, res) => {
    await Trashcan.deleteOne({ _id: req.params.id });
    console.log('trashcan removed')
    res.status(204).send()
});

router.get("/:typeAndPosition", async (req, res) => {
    let userLat = parseFloat(req.params.position.latitude.$numberDecimal);
    let userLng = parseFloat(req.params.position.longitude.$numberDecimal);


    let smallestTheta = 4.0; //Larger than PI
    let nearestTrashcan;
    trashcanList.forEach(element => {
        if (element.trashcanType == req.params.type) {
            let lat = parseFloat(element.latitude.$numberDecimal);
            let lng = parseFloat(element.longitude.$numberDecimal);
        
            let dLng = userLng - lng;

            let y = Math.sin(dLng) * Math.cos(lat2);
            let x = Math.cos(userLat) * Math.sin(lat) - Math.sin(userLat) * Math.cos(lat) * Math.cos(dLng);

            let theta = Math.atan2(y, x);
            theta += 2 * Math.PI;
            theta %= 2 * Math.PI;
            theta = 2 * Math.PI - theta;

            if (theta < smallestTheta)
            {
                nearestTrashcan = element;
                smallestTheta = theta;
            }
        }
    });

    if (smallestTheta == 4.0) {
        console.log("No trashcan found.");
        res.status(404);
    }
    else {
        console.log("Nearest trashcan: "+nearestTrashcan)
        res.status(200).json(nearestTrashcan);
    }
})


module.exports = router;