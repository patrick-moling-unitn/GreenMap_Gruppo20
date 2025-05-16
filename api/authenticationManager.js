const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

const RegisteringUser = require('../models/registeringUser');
const AuthenticatedUser = require('../models/authenticatedUser');

const SALT_ROUNDS = process.env.HASHING_SALT_ROUNDS;

router.get("/", async (req, res) => {
    console.log("get all authennticated users request")
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


router.post("/",  async (req, res) => {
    let authenticatedUser = await AuthenticatedUser.findOne({ email: req.body.email.toLowerCase()});
    if(!authenticatedUser)
        return res.status(400).json({messagge: "EMAIL INSERITA INESISTENTE"});

    await bcrypt.compare(req.body.password, authenticatedUser.passwordHash, function(err, result) {
        if (result == true)
            res.status(200).json({authToken: "test"});
        else
            res.status(400).json({messagge: "PASSWORD ERRATA"});
    });
});

router.delete('/', async (req, res) => {
    await AuthenticatedUser.deleteMany({})
    console.log('all authenticated users removed');
    res.status(204).send();
});


module.exports = router;