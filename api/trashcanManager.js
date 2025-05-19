const express = require('express');
const Trashcan = require('../models/trashcan');
const router = express.Router();
const geolib = require("geolib");

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
    const [lat, lng] = req.params.position.split(',').map(Number);
    console.log(req.params.position + " " + req.query.distance)

    if (isNaN(lat) || isNaN(lng))
        return res.status(400).json({message: "COORDINATES NOT VALID!"});
    
    let userPosition = {
        latitude: lat,
        longitude: lng
    }

    let trashcanList = await Trashcan.find({});
    trashcanList = trashcanList.filter(element => {
        let trashcanPosition =  {
            latitude: parseFloat(element.latitude),
            longitude: parseFloat(element.longitude)
        }
        return geolib.getDistance(userPosition, trashcanPosition) < req.query.distance;
    });
    
    res.status(200).json(trashcanList);
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
    let trashcanList = await Trashcan.find({});


    let smallestDistance = -1;
    let nearestTrashcan;
    trashcanList.forEach(element => {
        if (element.trashcanType == req.params.type) {
            let lat = parseFloat(element.latitude.$numberDecimal);
            let lng = parseFloat(element.longitude.$numberDecimal);


            let distance = geolib.getDistance(
                { userLat, userLng },
                { lat, lng }
            );

            if (distance < smallestDistance || smallestDistance == -1)
            {
                nearestTrashcan = element;
                smallestDistance = distance;
            }
        }
    });

    if (nearestTrashcan) {
        console.log("Nearest trashcan: "+nearestTrashcan)
        res.status(200).json(nearestTrashcan);
    }
    else {
        console.log("No trashcan found.");
        res.status(404);
    }
})


module.exports = router;