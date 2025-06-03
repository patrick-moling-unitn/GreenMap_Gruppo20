const express = require("express")
const CORS = require("cors")
const reportManager = require('./api/reportManager')
const trashcanManager = require('./api/trashcanManager')
const authenticationManager = require('./api/authenticationManager')
const registrationManager = require('./api/registrationManager')
const questionnaireManager = require('./api/questionnaireManager')
const discountManager = require('./api/discountManager')
const requestValidator = require('./api/requestValidator');

const API_V = process.env.API_VERSION;

if (API_V.endsWith("/v1"))
    throw new Error("Stai usando la versione API deprecata! Vai nel file .env e imposta API_VERSION=\"/api/v2\"");

const app = express()

app.use(CORS())
app.use(express.json());

app.get(API_V+"/discounts", requestValidator) //Devi essere autenticato per visualizzare tuti gli sconti
app.post(API_V+"/discounts", requestValidator) //Devi essere autenticato per aggiungere uno sconto
app.delete(API_V+"/discounts/:id", requestValidator) //Devi essere autenticato per rimuovere uno sconto

app.get(API_V+"/trashcans", requestValidator) //Devi essere autenticato per visualizzare tuti i cestini
app.post(API_V+"/trashcans", requestValidator) //Devi essere autenticato per aggiungere un cestino
app.put(API_V+"/trashcans/:id", requestValidator) //Devi essere autenticato per modificare un cestino
app.delete(API_V+"/trashcans/:id", requestValidator) //Devi essere autenticato per rimuovere un cestino

app.use(API_V+"/reports", requestValidator) //Devi essere autenticato per interagire con l'API reportManager

app.get(API_V+"/authenticatedUsers", requestValidator) //Devi essere amministratore per ottenere gli utenti
app.get(API_V+"/authenticatedUsers/:id/discounts", requestValidator) //Devi essere amministratore per eliminare un utente
app.delete(API_V+"/authenticatedUsers", requestValidator) //Devi essere amministratore per eliminare gli utenti
app.put(API_V+"/authenticatedUsers", requestValidator) //Devi essere amministratore per bandire gli utenti
app.put(API_V+"/authenticatedUsers/:id", requestValidator) //Devi essere amministratore per bandire gli utenti per id
app.delete(API_V+"/authenticatedUsers/:id", requestValidator) //Devi essere amministratore per eliminare un utente

app.get(API_V+"/registeringUsers/", requestValidator) //Devi essere amministratore per ottenere tutti gli utenti in registrazione
app.delete(API_V+"/registeringUsers/", requestValidator) //Devi essere amministratore per cancellare tutti gli utenti in registrazione
app.delete(API_V+"/registeringUsers/:id", requestValidator) //Devi essere amministratore per cancellare un utente in registrazione per id

app.use(API_V+"/questionnaires/", requestValidator) //Devi essere autenticato per poter interagire con qualsiasi API dei questionari

app.use(API_V+"/reports", reportManager)
app.use(API_V+"/trashcans", trashcanManager)
app.use(API_V+"/authenticatedUsers", authenticationManager)
app.use(API_V+"/registeringUsers", registrationManager)
app.use(API_V+"/questionnaires", questionnaireManager)
app.use(API_V+"/discounts", discountManager)

const path = __dirname + '/app/dist/';
console.log(path)
app.use(express.static(path));

module.exports = app;