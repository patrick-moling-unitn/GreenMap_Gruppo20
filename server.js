const express = require("express")
const CORS = require("cors")

const PORT = process.env.SERVER_PORT;

const app = express()

app.use(CORS())

const path = __dirname + '/app/dist/';
console.log(path)
app.use(express.static(path));

app.use("/", (req, res) =>{
    res.sendFile(path + "index.html");
})

app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) })