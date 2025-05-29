const express = require('express');
const Trashcan = require('../models/trashcan');
const router = express.Router();
const geolib = require("geolib");
const error = require('../enums/errorCodes.cjs.js');

const TEST_MODE = false;
const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH

const API_V = process.env.API_VERSION;

router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        if (LOG_MODE >= 1) console.log("get all trashcans request")
        let trashcanList = await Trashcan.find({});
        trashcanList = trashcanList.map((trashcan) => {
            return {
                self: API_V + '/trashcans/' + trashcan.id,
                latitude: trashcan.latitude,
                longitude: trashcan.longitude,
                trashcanType: trashcan.trashcanType
            };
        });
        res.status(200).json(trashcanList);
    }
});

router.get("/:position", async (req, res, next) => {
    if (req.query.distance){
        const [lat, lng] = req.params.position.split(',').map(Number);
        if (LOG_MODE >= 1) console.log("Get all trashcans near: " + req.params.position + " max distance (meters): " + req.query.distance)

        if (isNaN(lat) || isNaN(lng))
            return res.status(400).json({ errorCode: error("COORDINATES_CHOOSEN_NOT_VALID") });
        
        let userPosition = {
            latitude: lat,
            longitude: lng
        }

        let trashcanList = await Trashcan.find({});
        trashcanList = trashcanList.filter(element => {
            let trashcanPosition = {
                latitude: parseFloat(element.latitude),
                longitude: parseFloat(element.longitude)
            }
            return geolib.getDistance(userPosition, trashcanPosition) < req.query.distance;
        });
        
        res.status(200).json(trashcanList);
    }else if (req.query.type)
        next();
    else
        return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER") })//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
});

router.get("/:position", async (req, res) => {
    const [userLat, userLng] = req.params.position.split(',').map(Number);
    let trashcanList = await Trashcan.find({});
    if (LOG_MODE >= 1) console.log("Get closest trashcan near: " + req.params.position + " of type: " + req.query.type)

    let smallestDistance = Number.MAX_SAFE_INTEGER;
    let nearestTrashcan = null;
    trashcanList.forEach(element => {
        if (LOG_MODE >= 3) console.log("trashcan: " + element.trashcanType + " target: " + req.query.type + " cond: " + (element.trashcanType == req.query.type))
        if (element.trashcanType == req.query.type) {
            let lat = parseFloat(element.latitude);
            let lng = parseFloat(element.longitude);

            let distance = geolib.getDistance(
                { latitude: userLat, longitude: userLng },
                { latitude: lat, longitude: lng }
            );

            if (distance < smallestDistance)
            {
                nearestTrashcan = element;
                smallestDistance = distance;
            }
        }
    });

    if (nearestTrashcan) {
        if (LOG_MODE >= 2) console.log("Nearest trashcan: "+nearestTrashcan)
        res.status(200).json(nearestTrashcan);
    }
    else {
        if (LOG_MODE >= 2) console.warn("No trashcan found.");
        res.status(404).send();
    }
})

router.post("",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        if (LOG_MODE >= 1) console.log("Post trashcan request from user "+req.loggedUser.email)

        let trashcan = new Trashcan({
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            trashcanType: req.body.trashcanType
        });
        
        trashcan = await trashcan.save();
        
        let trashcanId = trashcan._id;

        if (LOG_MODE >= 1) console.log('Trashcan saved successfully!');

        res.location(API_V + "trashcans/" + trashcanId).status(201).send();
    }
});

router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        await Trashcan.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Trashcan removed!')
        res.status(204).send()
    }
});


module.exports = router;