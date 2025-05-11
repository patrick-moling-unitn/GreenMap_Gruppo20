const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const RegisteringUser = require('../models/registeringUser');
const User = require('../models/authenticatedUser');

const router = express.Router();
//costanti
const USER_PASSWORD_LENGTH =8;
const SALT_ROUNDS=10;
const USERNAME = process.env.EMAIL_USER;
const PASSWORD = process.env.EMAIL_PASS;

router.get("/allusers", async (req, res) => {
    console.log("get all users request")
    let usersList = await User.find({});
    usersList = usersList.map((user) => {
        return {
            self: '/users/' + user._id,
            email: user.email,
            passwordHash: user.passwordHash
        };
    });
    res.status(200).json(usersList);
});

router.post("/register",  async (req, res) => {

    alreadyRegisteringEmail= await RegisteringUser.findOne({ email: req.body.email.toLowerCase()});
    if(alreadyRegisteringEmail)
        return res.status(400).json({error: "already sent request"});
    alreadyExistingEmail= await User.findOne({ email: req.body.email.toLowerCase()});
    if(alreadyExistingEmail)
        return res.status(400).json({error: "email already existing"});
    if (req.body.password.length < USER_PASSWORD_LENGTH)
        return res.status(400).json({error: "password too short"});

    let reguser = new RegisteringUser({
        email: req.body.email,
        passwordHash: await bcrypt.hash(req.body.password, SALT_ROUNDS),
        verificationCode: {
            code: Math.floor(100000 + Math.random() * 900000).toString(),
            expireDate: new Date(Date.now() + 15 * 60 * 1000)
        }
    });

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: USERNAME,
            pass: PASSWORD
        }
        });
    var mailOptions = {
        from: 'noreply.software.engineering@gmail.com',
        to: req.body.email,
        subject: 'Your verification code',
        text: 'Your verification code is: '+ reguser.verificationCode.code
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    try{
        await reguser.save();
        return res.status(200).json({id: reguser._id});
    }catch(err){
        return res.status(500).json(err);
    }
});

router.use("/newuser",  async (req, res, next) => {
    const verifyinguser = await RegisteringUser.findById(req.body.id);
    if(!verifyinguser)
        return res.status(400).json({error: "user not existing"});
    if(verifyinguser.verificationCode.expireDate<new Date()){
        await RegisteringUser.deleteOne({ _id: req.body.id });
        return res.status(400).json({error: "time expired"});
    }
    if(verifyinguser.verificationCode.code != req.body.code)
        return res.status(400).json({error: "wrong code"});
    next();
});

router.post("/newuser",  async (req, res) => {
    const newuser = await RegisteringUser.findById(req.body.id);
	let user = new User({
        email: newuser.email,
        admin: false,
        points: 0,
        authenticated: false,
        passwordHash: newuser.passwordHash
    });
    await RegisteringUser.deleteOne({_id: req.body.id});
    try{
        await user.save();
        return res.location("user/" + user.id).status(201).send();
    }catch(err){
        return res.status(500).json(err);
    }

});

router.delete('/delete/:id', async (req, res) => {
    await User.deleteOne({ _id: req.params.id });
    console.log('user removed');
    res.status(204).json({ _id: req.params.id });
});
router.delete('/deleteall', async (req, res) => {
    await User.deleteMany({})
    await RegisteringUser.deleteMany({})
    console.log('all users removed');
    res.status(204).send();
});

module.exports = router;