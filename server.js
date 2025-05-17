const mongoose = require('mongoose');
const express = require("express")
const CORS = require("cors")
const trashcanManager = require('./api/trashcanManager')
const authenticationManager = require('./api/authenticationManager')
const registrationManager = require('./api/registrationManager')
const requestValidator = require('./api/requestValidator');

const PORT = process.env.SERVER_PORT;
const DB_URL = process.env.DATABASE_URL;
const API_V = process.env.API_VERSION;

const app = express()

app.use(CORS())
app.use(express.json());

app.post(API_V+"/trashcans", requestValidator) //TEST: devi essere autenticato per inviare un cestino

app.use(API_V+"/trashcans", trashcanManager)
app.use(API_V+"/login", authenticationManager)
app.use(API_V+"/register", registrationManager)

const path = __dirname + '/app/dist/';
console.log(path)
app.use(express.static(path));

console.log(DB_URL)
app.locals.db = mongoose.connect(DB_URL)
.then (() => {
    console.log("Connected to Database");
    app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) }) 
})
.catch ((e) => {
    console.log("Connessione al Database fallita"+e);
});