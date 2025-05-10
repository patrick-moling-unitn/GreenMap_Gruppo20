const express = require('express');
const User = require('../models/authenticatedUser');
const router = express.Router();
const USER_ID_LENGTH = 10;
const USER_PASSWORD_LENGTH =8;

router.get("/allusers", async (req, res) => {
    console.log("get all users request")
    let usersList = await User.find({});
    usersList = usersList.map((user) => {
        return {
            self: '/users/' + user._id,
            email: user.email,
            passwordHash: user.password
        };
    });
    res.status(200).json(usersList);
});

router.post("/newuser",  async (req, res) => {
    console.log("post trashcan request");
	let user = new User({
        email: req.body.email,
        admin: false,
        points: 0,
        authenticated: false,
        passwordHash: req.body.password
    });
    if (user.passwordHash.length < USER_PASSWORD_LENGTH)
        res.status(400).json({error: "password troppo breve"});
    else{
        try{
            await user.save();
            res.location("user/" + user.id).status(201).send();
        }catch(err){
            if (err.code === 11000 && Object.keys(err.keyValue)[0] == "email")
                res.status(400).json({error: "email già esistente"});
            else
                return res.status(500).json(err);
        }
    }
});

router.delete('/delete/:id', async (req, res) => {
    await User.deleteOne({ _id: req.params.id });
    console.log('user removed');
    res.status(204).json({ _id: req.params.id });
});

module.exports = router;