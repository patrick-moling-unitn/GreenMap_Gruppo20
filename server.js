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

app.get("/residue-bin-icon", (req, res) =>{
    res.sendFile(__dirname + "/app/public/" + "residue-bin-icon.png");
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