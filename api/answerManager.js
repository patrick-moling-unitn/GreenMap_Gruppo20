const express = require('express');
const Answer = require('../models/answer');
const router = express.Router();

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH


router.delete("/:issuerId", async (req, res) => {
    if (req.loggedUser.administrator || req.loggedUser.id == req.params.issuerId){
        if (LOG_MODE >= 1) console.log("Delete answers of user " + req.params.issuerId);
        try {
            await Answer.deleteMany({ userId: req.params.issuerId })
        }catch(err){
            return res.status(400).json({error: true, message: "ID not found."});
        }
        return res.status(200).send();
    }
    else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});


module.exports = router;