const mongoose = require('mongoose');
const app = require("./app");

const PORT = process.env.SERVER_PORT;
const DB_URL = process.env.DATABASE_URL;

console.log(DB_URL)
app.locals.db = mongoose.connect(DB_URL)
.then (async () => {
    console.log("Connected to Database");
    app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) })
})
.catch ((e) => {
    console.log("Connessione al Database fallita"+e);
});