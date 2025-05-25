const mongoose = require('mongoose');
const express = require("express")
const CORS = require("cors")
const reportManager = require('./api/reportManager')
const trashcanManager = require('./api/trashcanManager')
const authenticationManager = require('./api/authenticationManager')
const registrationManager = require('./api/registrationManager')
const questionnaireManager = require('./api/questionnaireManager')
const answerManager = require('./api/answerManager')
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

app.use(API_V+"/reports", requestValidator) //Devi essere autenticato per interagire con l'API reportManager

app.get(API_V+"/authenticatedUsers", requestValidator) //Devi essere amministratore per ottenere gli utenti
app.delete(API_V+"/authenticatedUsers", requestValidator) //Devi essere amministratore per eliminare gli utenti
app.put(API_V+"/authenticatedUsers", requestValidator) //Devi essere amministratore per bandire gli utenti
app.put(API_V+"/authenticatedUsers/:id", requestValidator) //Devi essere amministratore per bandire gli utenti per id

app.use(API_V+"/answerManager/", requestValidator) //Devi essere amministratore per bandire gli utenti in caso di risposte inappropriate ai questionari.

app.get(API_V+"/registeringUsers/", requestValidator) //Devi essere amministratore per ottenere tutti gli utenti in registrazione
app.delete(API_V+"/registeringUsers/", requestValidator) //Devi essere amministratore per cancellare tutti gli utenti in registrazione
app.delete(API_V+"/registeringUsers/:id", requestValidator) //Devi essere amministratore per cancellare un utente in registrazione per id

app.use(API_V+"/questionnaires/", requestValidator) //Devi essere autenticato per poter interagire con qualsiasi API dei questionari

app.use(API_V+"/reports", reportManager)
app.use(API_V+"/trashcans", trashcanManager)
app.use(API_V+"/authenticatedUsers", authenticationManager)
app.use(API_V+"/registeringUsers", registrationManager)
app.use(API_V+"/questionnaires", questionnaireManager)
app.use(API_V+"/answerManager", answerManager)

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