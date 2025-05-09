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
            self: '/users/' + user.id,
            id: user.id,
            username: user.username,
            email: user.email,
            passwordHash: user.password
        };
    });
    res.status(200).json(usersList);
});

router.post("/newuser",  async (req, res) => {
    console.log("post trashcan request");
	let user = new User({
        id: "",
        username: req.body.username,
        email: req.body.email,
        admin: false,
        points: 0,
        authenticated: false,
        passwordHash: req.body.password
    });
    if (user.passwordHash.length < USER_PASSWORD_LENGTH)
        return res.status(400).json({error: "password troppo breve"});

    async function generateAndSendId(){
        user.id=Math.random().toString(36).substring(2, USER_ID_LENGTH+2);
        try{
            await user.save();
            return res.location("user/" + user.id).status(201).send();
        }catch(err){
            if (err.code === 11000){
                const duplicateKey = Object.keys(err.keyValue)[0];
                if(duplicateKey == "id")
                    return await generateAndSendId();
                else if(duplicateKey == "email")
                    return res.status(400).json({error: "email già esistente"});
            }
            else{
                return res.status(500).json(err);
            }
        }      
    }
    await generateAndSendId();    
});

router.delete('/delete/:id', async (req, res) => {
    await User.deleteOne({ id: req.params.id });
    console.log('user removed');
    res.status(204).json({ id: req.params.id });
});

module.exports = router;