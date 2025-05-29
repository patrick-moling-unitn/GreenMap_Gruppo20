const express = require('express');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');
const error = require('../enums/errorCodes.cjs.js');

const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE=false;

const API_V = process.env.API_VERSION;

router.get("/", async (req, res, next) => {
    if(req.query.type == "all"){
        if (req.loggedUser.administrator != true)
            return res.status(401).json({ errorCode: error("UNAUTHORIZED") });//.json({error: true, message: 'Requesting user is not an administrator!'});
        if (LOG_MODE >= 1) console.log("Get all authenticated users request!")
        const {administrator, banned, email, lastReportDate, points} = req.query;
        let query = {};
        query.email = { $regex: email};

        if (banned !== '') query.banned = banned;
        if (administrator !== '') query.administrator = administrator;
        if (lastReportDate !== '') query.lastReportDate = lastReportDate;
        if (points !== '') query.points = Number(points);

        let userList = await AuthenticatedUser.find(query);
            userList = userList.map((user) => {
            return {
                self: API_V + '/authenticatedUsers/' + user._id,
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
        next()
});
router.get("/", async (req, res) => {
    if(req.query.type == "personal"){
        if (LOG_MODE >= 1) console.log("Get user request!")
        let user = await AuthenticatedUser.findOne({_id:req.loggedUser.id});
        user = {
            self: API_V + '/authenticatedUsers/' + user._id,
            email: user.email,
            banned: user.banned,
            administrator: user.administrator,
            points: user.points,
            lastReportIssueDate: user.lastReportIssueDate
        }
        res.status(200).json(user);
    }else
        return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER")} )//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
});
router.put("/:id", async (req, res) => {
    if (LOG_MODE >= 1) console.log("Ban authenticated user request!")
    if (req.loggedUser.administrator == true || TEST_MODE){
        let authenticatedUser;
        try{
            authenticatedUser = await AuthenticatedUser.findOne({isSystem:false, _id: req.params.id});
        }catch(err){
            return res.status(400).json({ errorCode: error("ID_NOT_FOUND") })//.json({error: true, message: "ID UTENTE INSERITO INESISTENTE"});
        }
            authenticatedUser.banned = true;
        try{
            authenticatedUser.save();
        }catch(err){
            return res.status(500).json({ errorMessage: err });
        }

        res.status(200).json(authenticatedUser);
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});
router.put("/", async (req, res) => {
    if (LOG_MODE >= 1) console.log("Ban/Unban and Promote/Demote authenticated user request!")
    if (req.loggedUser.administrator == true || TEST_MODE){
        let authenticatedUser;
        try{
            authenticatedUser = await AuthenticatedUser.findOne({isSystem:false, _id: req.body.id});
        }catch(err){
            return res.status(400).json({ errorCode: error("ID_NOT_FOUND") })//.json({error: true, message: "ID UTENTE INSERITO INESISTENTE"});
        }
        if(req.body.editBan)
            authenticatedUser.banned = !authenticatedUser.banned;
        if(req.body.editAdmin)
            authenticatedUser.administrator = !authenticatedUser.administrator;
        try{
            authenticatedUser.save();
        }catch(err){
            return res.status(500).json({ errorMessage: err });
        }

        res.status(200).json(authenticatedUser);
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

router.post("/",  async (req, res) => {
    if (LOG_MODE >= 1) console.log("Authentication request!")
    let authenticatedUser = await AuthenticatedUser.findOne({ email: req.body.email.toLowerCase()});
    if(!authenticatedUser)
        return res.status(400).json({ errorCode: error("AUTHENTICATED_USER_EMAIL_NOT_FOUND") })
    if(authenticatedUser.banned)
        return res.status(400).json({ errorCode: error("AUTHENTICATED_USER_BANNED") })

    await bcrypt.compare(req.body.password, authenticatedUser.passwordHash, function(err, result) {
        if (result == true){
            let options = { expiresIn: 24 * 60 * 60_000 } // expires in 24 hours
            let payload = {id: authenticatedUser._id, email: authenticatedUser.email, 
                administrator: authenticatedUser.administrator, expiresIn: options.expiresIn}
            //console.log(jwt.sign(payload, process.env.JWT_SECRET, options))
            res.status(200).json({ authToken: jwt.sign(payload, process.env.JWT_SECRET, options) });
        }
        else
            res.status(400).json({ errorCode: error("AUTHENTICATED_USER_BANNED") })
    });
});

router.delete('/:id', async (req, res) => {
        if (LOG_MODE >= 1) console.log("Delete authenticated user request!")
    if (req.loggedUser.administrator == true || TEST_MODE || req.loggedUser.id == req.params.id ){
        await AuthenticatedUser.deleteOne({isSystem:false, _id: req.params.id})
        if (LOG_MODE >= 2) console.log("Authenticated user deleted!")
        res.status(204).send();
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});


module.exports = router;