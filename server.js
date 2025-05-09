const mongoose = require('mongoose');
const express = require("express")
const CORS = require("cors")
const trashcan = require('./api/trashcanManager')

//const trashcanManager = require("./app/api/trashcanManager.js")
//app.use(trashcanManager)

const PORT = process.env.SERVER_PORT;
const DB_URL = process.env.DATABASE_URL;

const app = express()

app.use(CORS())
app.use(express.json());

app.use("/trashcans", trashcan)

app.get("/recycle-bin-hardshadow", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "recycle-bin-hardshadow.png");
})
app.get("/recycle-bin-shadow", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "recycle-bin-shadow.png");
})
app.get("/paper-bin-icon", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "paper-bin-icon.png");
})
app.get("/plastic-bin-icon", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "plastic-bin-icon.png");
})
app.get("/residue-bin-icon", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "residue-bin-icon.png");
})
app.get("/glass-bin-icon", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "glass-bin-icon.png");
})
app.get("/organic-bin-icon", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "organic-bin-icon.png");
})

const path = __dirname + '/app/dist/';
console.log(path)
app.use(express.static(path));

app.get("/", (req, res) =>{
    res.sendFile(path + "index.html");
})

console.log(DB_URL)
app.locals.db = mongoose.connect(DB_URL)
.then (() => {
    console.log("Connected to Database");
    app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) }) 
})
.catch ((e) => {
    console.log("Connessione al Database fallita"+e);
});