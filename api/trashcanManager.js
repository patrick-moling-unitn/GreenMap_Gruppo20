const express = require('express');
const Trashcan = require('../models/trashcan');
const router = express.Router();
const error = require('../enums/errorCodes.cjs.js');
const geolibUtility = require('./getolibUtility.js');

const TEST_MODE = false;
const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const SIMULATE_NO_TRASHCANS_IN_DB = false

const API_V = process.env.API_VERSION;

/**
 * RELATIVE PATH)
 *  .../trashcans/ORIGIN_POSITION
 * WHY WE HAD TO "BREAK" RESTful CONVENTIONS)
 *  using a query parameter for "position" instead of a path parameter would have been a better RESTful 
 *  approach. The issue is that, due to the fact that only authenticated users can execute the GET "trashcans/" 
 *  request, we need to differentiate whether a user is executing a request to get the closest 
 *  trashcans or to get all trashcans since requesting the closest trashcans DOESN'T require authentication. 
 *  In the reportManager class this problem didn't arise since all methods inside the class require 
 *  authentication so there was no need to differentiate between various authentication status.
 * DESCRIPTION)
 *  the method permits an anonymous requesting user to get the trashcans within a specified range 
 *  from his position. If the query parameter "distance" isn't provided the request will get 
 *  forwarded to the next method.
 * PARAMS)
 *  position: the origin point where the search begins
 *  query.distance: the maximum distance a trashcan can have from the origin
 * SUCCESSFUL RETURNS)
 *  trashcanList: the list of trashcans which position is inside the searched circle
 */
router.get("/:position", async (req, res, next) => {
    let [lat, lng] = req.params.position.split(',').map(Number);
    if (!geolibUtility.areLatLngValid(lat, lng))
        return res.status(400).json({ errorCode: error("COORDINATES_CHOOSEN_NOT_VALID") });
    req.latitude = lat;
    req.longitude = lng;

    if (req.query.distance){
        if (LOG_MODE >= 1) console.log("Get all trashcans near: " + req.params.position + " max distance (meters): " + req.query.distance)

        let userPosition = geolibUtility.latLngToJSON(req.latitude, req.longitude);

        let trashcanList = await Trashcan.find({});
        trashcanList = geolibUtility.filterClosestElementsOnList(trashcanList, userPosition, req.query.distance);
        res.status(200).json(trashcanList);
    }else if (req.query.type)
        next(); //CONTINUES BELOW<!!!>
    else
        return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER") })
});

/**
 * RELATIVE PATH)
 *  .../trashcans/ORIGIN_POSITION
 * WHY WE HAD TO "BREAK" RESTful CONVENTIONS)
 *  explained above
 * DESCRIPTION)
 *  the method permits an anonymous requesting user to get a trashcan, which type is
 *  specified in the request, closest to his position.
 * PARAMS)
 *  position: the origin point where the search begins
 *  query.type: the type of trashcan to search for
 * SUCCESSFUL RETURNS)
 *  nearestTrashcan: the trashcans of the type specified closest to the user position
 */
router.get("/:position", async (req, res) => {
    let trashcanList = SIMULATE_NO_TRASHCANS_IN_DB ? [] : await Trashcan.find({});
    if (LOG_MODE >= 1) console.log("Get closest trashcan near: " + req.params.position + " of type: " + req.query.type)

    let userPosition = geolibUtility.latLngToJSON(req.latitude, req.longitude),
        smallestDistance = Number.MAX_SAFE_INTEGER,
        nearestTrashcan = null;
    trashcanList.forEach(element => {
        if (LOG_MODE >= 3) console.log("trashcan: " + element.trashcanType + " target: " + req.query.type + " cond: " + (element.trashcanType == req.query.type))
        if (element.trashcanType == req.query.type) {
            let lat = parseFloat(element.latitude);
            let lng = parseFloat(element.longitude);

            let distance = geolibUtility.distance(userPosition, geolibUtility.latLngToJSON(lat, lng));

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

/**
 * RELATIVE PATH)
 *  .../trashcans/
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to get all the trashcans
 * SUCCESSFUL RETURNS)
 *  trashcanList: the list of all the trashcans
 */
router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
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

/**
 * RELATIVE PATH)
 *  .../trashcans/
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to add a new trashcan
 *  which will be from now on seen by all users
 * PARAMS)
 *  body.latitude: the first coordinate of the trashcan you want to add
 *  body.longitude: the second coordinate of the trashcan you want to add
 *  body.trashcanType: the type of trashcan you want to add
 */
router.post("",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
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
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../trashcans/TRASHCAN_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to update 
 *  the type of an existing trashcan 
 * PARAMS)
 *  id: the identifier of the trashcan to update
 *  body.trashcanType: the new type of trashcan you want to set
 */
router.put('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        let trashcan = await Trashcan.findById(req.params.id);
        if (!trashcan) 
            return res.status(400).json({ errorCode: error("ID_NOT_FOUND") })

        trashcan.trashcanType = req.body.trashcanType;

        try {
            trashcan.save();
        } catch(err) {
            return res.status(500).json({ errorMessage: err });
        }
        res.status(200).send();
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../trashcans/TRASHCAN_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, 
 *  to delete an existing trashcan 
 * PARAMS)
 *  id: the identifier of the trashcan to delete
 */
router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await Trashcan.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Trashcan removed!')
        res.status(204).send()
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});


module.exports = router;