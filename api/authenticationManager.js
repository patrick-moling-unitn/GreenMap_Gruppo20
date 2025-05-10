const express = require('express');
const AuthenticatedUser = require('../models/authenticatedUser');
const router = express.Router();



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



module.exports = router;