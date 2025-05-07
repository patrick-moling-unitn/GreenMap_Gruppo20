const express = require("express")
const CORS = require("cors")
const mongoose = require('mongoose');

const PORT = process.env.SERVER_PORT;
const DB_URL = process.env.DATABASE_URL;

const app = express()

app.use(CORS())

const path = __dirname + '/app/dist/';
console.log(path)
app.use(express.static(path));

app.use("/", (req, res) =>{
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