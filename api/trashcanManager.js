const express = require('express');
const Trashcan = require('../models/trashcan');
const router = express.Router();

const TrashType = Object.freeze({
    PAPER: 0,
    PLASTIC: 1,
    RESIDUE: 2,
    GLASS: 3,
    ANY: 4
});

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

router.post("",  async (req, res) => {
    console.log("post trashcan request")
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

module.exports = router;