const express = require('express');
const router = express.Router();

const RegisteringUser = require('../models/registeringUser');
const AuthenticatedUser = require('../models/authenticatedUser');

const SALT_ROUNDS = Number(process.env.HASHING_SALT_ROUNDS);
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
            authenticated: user.authenticated,
            administrator: user.administrator,
            points: user.points
        };
    });
    res.status(200).json(userList);
});

router.put("/:id", async (req, res) => {
    console.log("ban authenticated user request")
    let authenticatedUser = await AuthenticatedUser.findOne({ _id: id});
    if(!authenticatedUser)
        return res.status(400).json({messagge: "ID INSERITO INESISTENTE"});
    authenticatedUser.banned = true;
    
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
        return res.status(400).json({messagge: "EMAIL INSERITA INESISTENTE"});

    await bcrypt.compare(req.body.password, authenticatedUser.passwordHash, function(err, result) {
        if (result == true){
            let payload = {id: authenticatedUser._id, email: authenticatedUser.email, administrator: authenticatedUser.administrator}
            let options = { expiresIn: 86400 } // expires in 24 hours
            res.status(200).json({authToken: jwt.sign(payload, process.env.JWT_SECRET, options)});
        }
        else
            res.status(400).json({messagge: "PASSWORD ERRATA"});
    });
});

router.delete('/', async (req, res) => {
    await AuthenticatedUser.deleteMany({})
    console.log('all authenticated users removed');
    res.status(204).json({messagge: "UTENTI AUTENTICATI CANCELLATI"});
});


module.exports = router;