const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const RegisteringUser = require('../models/registeringUser');
const AuthenticatedUser = require('../models/authenticatedUser');

const router = express.Router();
//costanti
const EMAIL_CODE_EXPIRATION_TIME_MIN=15
const MIN_USER_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = Number(process.env.HASHING_SALT_ROUNDS);
const USERNAME = process.env.EMAIL_USER;
const PASSWORD = process.env.EMAIL_PASS;

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE = true;

const API_V = process.env.API_VERSION;

router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all registering user request!")
        let usersList = await RegisteringUser.find({});
        usersList = usersList.map((user) => {
            return {
                self: API_V + '/registeringUsers/' + user._id,
                email: user.email,
                passwordHash: user.passwordHash
            };
        });
        res.status(200).json(usersList);
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.post("/",  async (req, res, next) => {
    if (req.body.email)
    {
        alreadyRegisteringEmail = await RegisteringUser.findOne({ email: req.body.email.toLowerCase()});
        if(alreadyRegisteringEmail)
            return res.status(400).json({error: "already sent request"});
        alreadyExistingEmail = await AuthenticatedUser.findOne({ email: req.body.email.toLowerCase()});
        if(alreadyExistingEmail)
            return res.status(400).json({error: "email already existing"});
        if (req.body.password.length < MIN_USER_PASSWORD_LENGTH)
            return res.status(400).json({error: "password too short"});

        let reguser = new RegisteringUser({
            email: req.body.email,
            passwordHash: await bcrypt.hash(req.body.password, SALT_ROUNDS),
            verificationCode: {
                code: Math.floor(100000 + Math.random() * 900000).toString(),
                expireDate: new Date(Date.now() + EMAIL_CODE_EXPIRATION_TIME_MIN * 60 * 1000)
            }
        });

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: USERNAME,
                pass: PASSWORD
            }
            });
        let mailOptions = {
            from: 'noreply.software.engineering@gmail.com',
            to: req.body.email,
            subject: '[GreenMap] Verify your email',
            text: 'Your verification code is: '+ reguser.verificationCode.code + '\n' +
                  'The verification code will expire in '+EMAIL_CODE_EXPIRATION_TIME_MIN+' minutes.'
        };
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                if (LOG_MODE >= 1) console.warn(error);
            } else {
                if (LOG_MODE >= 1) console.log('Email sent: ' + info.response);
            }
        });
        try{
            await reguser.save();
            return res.status(200).json({id: reguser._id});
        }catch(err){
            return res.status(500).json(err);
        }
    }else 
        next();
});

router.post("/",  async (req, res, next) => {
    const verifyinguser = await RegisteringUser.findById(req.body.id);
    if(!verifyinguser)
        return res.status(400).json({error: "user not existing"});
    if(verifyinguser.verificationCode.expireDate<new Date()){
        await RegisteringUser.deleteOne({ _id: req.body.id });
        return res.status(400).json({error: "time expired"});
    }
    if(verifyinguser.verificationCode.code != req.body.code)
        return res.status(400).json({error: "wrong code"});
    req['registeringUser'] = verifyinguser;
    next();
});

router.post("/",  async (req, res) => {
    const newuser = req['registeringUser'];
	let user = new AuthenticatedUser({
        email: newuser.email,
        administrator: false,
        points: 0,
        banned: false,
        passwordHash: newuser.passwordHash
    });
    await RegisteringUser.deleteOne({_id: req.body.id});
    try{
        await user.save();
        if (LOG_MODE >= 1) console.log('Registering user created!');
        return res.location(API_V + '/registeringUsers/' + user.id).status(201).send();
    }catch(err){
        return res.status(500).json(err);
    }
});

router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await AuthenticatedUser.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Registering user removed!');
        res.status(204).json({ _id: req.params.id });
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.delete('/', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await RegisteringUser.deleteMany({})
        if (LOG_MODE >= 1) console.log('All registering users removed!');
        res.status(204).send();
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

module.exports = router;