const mongoose = require('mongoose');
const express = require("express")
const CORS = require("cors")
const reportManager = require('./api/reportManager')
const trashcanManager = require('./api/trashcanManager')
const authenticationManager = require('./api/authenticationManager')
const registrationManager = require('./api/registrationManager')
const requestValidator = require('./api/requestValidator');

const AuthenticatedUser = require('./models/authenticatedUser')
const bcrypt = require('bcrypt')

const PORT = process.env.SERVER_PORT;
const DB_URL = process.env.DATABASE_URL;
const API_V = process.env.API_VERSION;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASS;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);

const app = express()

app.use(CORS())
app.use(express.json());

app.get(API_V+"/trashcans", requestValidator) //Devi essere autenticato per visualizzare tuti i cestini
app.post(API_V+"/trashcans", requestValidator) //Devi essere autenticato per aggiungere un cestino
app.delete(API_V+"/trashcans/:id", requestValidator) //Devi essere autenticato per rimuovere un cestino

app.use(API_V+"/reports", requestValidator) //TEST: devi essere autenticato per inviare un report
app.get(API_V+"/login", requestValidator) //TEST: devi essere amministratore per ottenere gli utenti
app.delete(API_V+"/login", requestValidator) //TEST: devi essere amministratore per eliminare gli utenti
app.put(API_V+"/login", requestValidator) //TEST: devi essere amministratore per bandire gli utenti
app.put(API_V+"/login/:id", requestValidator) //TEST: devi essere amministratore per bandire gli utenti per id
app.get(API_V+"/reports", requestValidator) //TEST: devi essere amministratore per ottenere gli utenti registrandi
app.delete(API_V+"/reports", requestValidator) //TEST: devi essere amministratore per bandire gli utenti registrandi

app.use(API_V+"/reports", reportManager)
app.use(API_V+"/trashcans", trashcanManager)
app.use(API_V+"/login", authenticationManager)
app.use(API_V+"/register", registrationManager)

const path = __dirname + '/app/dist/';
console.log(path)
app.use(express.static(path));

console.log(DB_URL)
app.locals.db = mongoose.connect(DB_URL)
.then (async () => {
    console.log("Connected to Database");
    app.listen(PORT, () => { console.log(`Listening on port ${PORT}`) })
    //default admin
    const adminExists = await AuthenticatedUser.findOne({ email: ADMIN_EMAIL });
    if(!adminExists){
        await AuthenticatedUser.create({
            passwordHash: await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
            email: ADMIN_EMAIL,
            banned: false,
            administrator: true,
            points: 0,
            isSystem: true
        })
    }
})
.catch ((e) => {
    console.log("Connessione al Database fallita"+e);
});