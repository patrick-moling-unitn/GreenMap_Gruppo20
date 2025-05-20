const express = require('express');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');
const TEST_MODE=false;

router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        console.log("get all authenticated users request")
        const {administrator, banned, email, lastReportDate, points}= req.query;
        let query = {};
            query.email = { $regex: email};
        if (banned !== '') {
            query.banned = banned;
        }
        if (administrator !== '') {
            query.administrator = administrator;
        }
        if(lastReportDate !== ''){
            query.lastReportDate = lastReportDate;
        }
        if (points !== '') {
            query.points = Number(points);
        }
        let userList = await AuthenticatedUser.find(query);
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
            authenticatedUser = await AuthenticatedUser.findOne({isSystem:false, _id: req.params.id});
        }catch(err){
            return res.status(400).json({error: true, message: "ID UTENTE INSERITO INESISTENTE"});
        }
            authenticatedUser.banned = true;
        try{
            authenticatedUser.save();
        }catch(err){
            return res.status(500).json(err);
        }

        res.status(200).json(authenticatedUser);
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});
router.put("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        let authenticatedUser;
        try{
            authenticatedUser = await AuthenticatedUser.findOne({isSystem:false, email: req.body.email});
        }catch(err){
            return res.status(400).json({error: true, message: "ID UTENTE INSERITO INESISTENTE"});
        }
        if(req.body.editBan)
            authenticatedUser.banned = !authenticatedUser.banned;
        if(req.body.editAdmin)
            authenticatedUser.administrator = !authenticatedUser.administrator;
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
            res.status(200).json({authToken: jwt.sign(payload, process.env.JWT_SECRET, options), administrator: authenticatedUser.administrator});
        }
        else
            res.status(400).json({message: "PASSWORD ERRATA"});
    });
});

router.delete('/', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await AuthenticatedUser.deleteOne({isSystem:false, email: req.body.email})
        console.log('user removed');
        res.status(204).json({message: "UTENTE CANCELLATO"});
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});


module.exports = router;