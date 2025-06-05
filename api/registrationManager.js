const express = require('express');
const bcrypt = require('bcrypt');
const mailProvider = require('./mailProvider')

const RegisteringUser = require('../models/registeringUser');
const AuthenticatedUser = require('../models/authenticatedUser');
const error = require('../enums/errorCodes.cjs.js');

const router = express.Router();
//costanti
const EMAIL_CODE_EXPIRATION_TIME_MIN=15
const MIN_USER_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = Number(process.env.HASHING_SALT_ROUNDS);

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
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

router.post("/",  async (req, res, next) => {
    if(req.path == "/"){
        alreadyRegisteringEmail = await RegisteringUser.findOne({ email: req.body.email.toLowerCase()});
        let verificationCode = alreadyRegisteringEmail ? alreadyRegisteringEmail.verificationCode : null;
        if (verificationCode){ //IF USER IS ALREADY VERIFYING
            if (verificationCode.expireDate<new Date()){ //IF THE VERIFICATION CODE EXPIRED DELETE THE USER
                await RegisteringUser.deleteOne(alreadyRegisteringEmail);
                alreadyRegisteringEmail = null;
            }else{  //IF THE VERIFICATION CODE IS VALID CHECK THE PASSWORD AND RETURN HIS USER ID
                bcrypt.compare(req.body.password, alreadyRegisteringEmail.passwordHash, function (err, result) {
                    if (result == true)
                        res.status(200).json({ id: alreadyRegisteringEmail._id });
                    else
                        res.status(400).json({ errorCode: error("WRONG_PASSWORD") });
                });
                return; //return dentro bcrypt.compare non impedisce al metodo di coninuare!
            }
        }

        if(alreadyRegisteringEmail)
            return res.status(400).json({ errorCode: error("REGISTRATING_USER_DUPLICATED_REQUEST") });
        alreadyExistingEmail = await AuthenticatedUser.findOne({ email: req.body.email.toLowerCase()});
        if(alreadyExistingEmail)
            return res.status(400).json({ errorCode: error("EMAIL_ALREADY_REGISTERED") });
        if (req.body.password.length < MIN_USER_PASSWORD_LENGTH)
            return res.status(400).json({ errorCode: error("REGISTRATING_USER_INVALID_PASSWORD") });

        let reguser = new RegisteringUser({
            email: req.body.email,
            passwordHash: await bcrypt.hash(req.body.password, SALT_ROUNDS),
            verificationCode: {
                code: Math.floor(100000 + Math.random() * 900000).toString(),
                expireDate: new Date(Date.now() + EMAIL_CODE_EXPIRATION_TIME_MIN * 60 * 1000)
            }
        });

        let mailOptions = {
            subject: '[GreenMap] Verify your email',
            text: 'Your verification code is: '+ reguser.verificationCode.code + '\n' +
                  'The verification code will expire in '+EMAIL_CODE_EXPIRATION_TIME_MIN+' minutes.'
        };
        mailProvider.sendMail(req.body.email, mailOptions.subject, mailOptions.text);
        try{
            await reguser.save();
            res.location(API_V + '/registeringUsers/' + reguser._id).status(201).json({id: reguser._id});
        }catch(err){
            return res.status(500).json({ errorMessage: err });
        }
    }else 
        next();
});

router.post("/:id/code",  async (req, res, next) => {
    const verifyinguser = await RegisteringUser.findById(req.params.id);
    if(!verifyinguser)
        return res.status(400).json({ errorCode: error("INVALID_REGISTRATION_REQUEST") });
    if(verifyinguser.verificationCode.expireDate<new Date()){
        await RegisteringUser.deleteOne({ _id: req.params.id });
        return res.status(400).json({ errorCode: error("REGISTRATION_CODE_EXPIRED") });
    }
    if(verifyinguser.verificationCode.code != req.body.code)
        return res.status(400).json({ errorCode: error("REGISTRATION_CODE_INVALID") });
    req['registeringUser'] = verifyinguser;
    next();
});

router.post("/:id/code",  async (req, res) => {
    const newuser = req['registeringUser'];
	let user = new AuthenticatedUser({
        email: newuser.email,
        administrator: false,
        points: 0,
        banned: false,
        passwordHash: newuser.passwordHash
    });
    await RegisteringUser.deleteOne({_id: req.params.id});
    try{
        await user.save();
        if (LOG_MODE >= 1) console.log('Registering user created!');
        return res.location(API_V + '/authenticatedUsers/' + user._id).status(201).send();
    }catch(err){
        return res.status(500).json({ errorMessage: err });
    }
});

router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await AuthenticatedUser.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Registering user removed!');
        res.status(204).send();
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

router.delete('/', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await RegisteringUser.deleteMany({})
        if (LOG_MODE >= 1) console.log('All registering users removed!');
        res.status(204).send();
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

module.exports = router;