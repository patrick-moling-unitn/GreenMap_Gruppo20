const express = require('express');
const Answer = require('../models/answer');
const AuthenticatedUser = require('../models/authenticatedUser');
const router = express.Router();

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH


router.delete("/:issuerId", async (req, res) => {
    if (req.loggedUser.administrator)
    {
        if (LOG_MODE >= 1) console.log("Delete answers of user " + req.params.issuerId + " and ban that user.");

        try {
            await Answer.deleteMany({ userId: req.params.issuerId })
        }catch(err){
            return res.status(400).json({error: true, message: "ID not found."});
        }

        let user = await AuthenticatedUser.findOne({_id: req.params.issuerId});
        user.banned = true;
        user.save();

        return res.status(200).send();
    }
    else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});


module.exports = router;