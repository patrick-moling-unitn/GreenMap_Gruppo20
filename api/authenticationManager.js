const express = require('express');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const TEST_MODE=false;

router.get('/me', (req, res) => {
    res.json(req.loggedUser);
});

router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        console.log("get all authenticated users request")
        let userList = await AuthenticatedUser.find({});
        userList = userList.map((user) => {
            return {
                self: '/authenticatedUser/' + user.id,
                passwordHash: user.passwordHash,
                email: user.email,
                banned: user.banned,
                administrator: user.administrator,
                points: user.points,
                lastReportIssueDate: user.lastReportIssueDate
            };
        });
        res.status(200).json(userList);
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.put("/:id", async (req, res) => {
    console.log("ban authenticated user request")
    if (req.loggedUser.administrator == true || TEST_MODE){
        let authenticatedUser;
        try{
            authenticatedUser = await AuthenticatedUser.findById(req.params.id);
        }catch(err){
            return res.status(400).json({error: true, message: "ID UTENTE INSERITO INESISTENTE"});
        }
        
        authenticatedUser.banned = req.body.banned;
        
        try{
            authenticatedUser.save();
        }catch(err){
            return res.status(500).json(err);
        }

        res.status(200).json(authenticatedUser);
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.post("/",  async (req, res) => {
    let authenticatedUser = await AuthenticatedUser.findOne({ email: req.body.email.toLowerCase()});
    if(!authenticatedUser)
        return res.status(400).json({message: "EMAIL INSERITA INESISTENTE"});

    await bcrypt.compare(req.body.password, authenticatedUser.passwordHash, function(err, result) {
        if (result == true){
            let payload = {id: authenticatedUser._id, email: authenticatedUser.email, administrator: authenticatedUser.administrator}
            let options = { expiresIn: 86400 } // expires in 24 hours
            res.status(200).json({authToken: jwt.sign(payload, process.env.JWT_SECRET, options)});
        }
        else
            res.status(400).json({message: "PASSWORD ERRATA"});
    });
});

router.delete('/', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await AuthenticatedUser.deleteMany({isSystem:false})
        console.log('all authenticated users removed');
        res.status(204).json({message: "UTENTI AUTENTICATI CANCELLATI"});
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});


module.exports = router;