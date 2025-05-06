const express = require("express")
const CORS = require("cors")

const app = express()

app.use(CORS())

const path = __dirname + '/app/dist/';
console.log(path)
app.use(express.static(path));

app.use("/", (req, res) =>{
    res.sendFile(path + "index.html");
})

app.listen(3000, () => { console.log("Listening on port 3000") })