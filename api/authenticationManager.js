const express = require('express');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

router.get("/", async (req, res) => {
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
});

router.put("/:id", async (req, res) => {
    console.log("ban authenticated user request")

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
    await AuthenticatedUser.deleteMany({})
    console.log('all authenticated users removed');
    res.status(204).json({message: "UTENTI AUTENTICATI CANCELLATI"});
});


module.exports = router;