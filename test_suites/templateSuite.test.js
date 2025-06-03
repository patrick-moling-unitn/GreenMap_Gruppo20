const request = require('supertest'); 
const app = require('../app.js');
const jwt = require('jsonwebtoken'); 
const mongoose = require('mongoose');

let API_METHOD = "<METHOD_TO_UPPER_CASE>", // GET, POST, PUT, DELETE, ...
    API_PATH = "<API_PATH_WITHOUT_SLASH>", // reports, trashcans, authenticatedUsers, ...
    API_DESCRIPTION = "<parameters description>"; // with report type null, with userId null, with missing password, ...

//Non è necessario avviare il server.js per far funzionare questa test suite!
describe(API_METHOD + "/api/v2/"+API_PATH, () => {
    beforeAll( async () => { //Se vuoi lavorare sul database puoi farlo direttamente in questa suite
        jest.setTimeout(8000);
        app.locals.db = await mongoose.connect(process.env.DATABASE_URL); });
    afterAll( () => { mongoose.connection.close(true); });

    let adminUser = true, //Se l'utente che sta eseguendo la richiesta è un admin
        tokenExpiration = 86400, //Tempo che ci mette il token a scadere in secondi
        userId = "$2b$10$grA8jaHQ.m.fNSRyFArsh.FU.ct071WBMGpVTRkdCGcwUiL0G.zQe", //ID esistente per superare i check su alcune API
        payload = {id: userId, email: 'John@mail.com', administrator: adminUser, expiresIn: tokenExpiration}
        token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: tokenExpiration} ); //creazione auth token

    let expectedHttpCode = 400,
        expectedHttpJSON = { errorCode: 2 }

    test(API_METHOD+" /api/v2/"+API_PATH+" "+API_DESCRIPTION, () => {
                          //  ↓ > sostituisci 'post' con il tuo metodo (API_METHOD)
        return request(app).post('/api/v2/'+API_PATH)
        .set('x-access-token', token).set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});