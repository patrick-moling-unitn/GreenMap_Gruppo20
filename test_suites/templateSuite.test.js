const request = require('supertest'); 
const app = require('../app.js');
const error = require('../enums/errorCodes.cjs.js');
const testUtility = require('./testUtility.js')

let API_METHOD = "<METHOD_TO_UPPER_CASE>", // GET, POST, PUT, DELETE, ...
    API_PATH = "<API_PATH_WITHOUT_SLASH>", // reports, reports/akfei412fjAopf, trashcans, trashcans/54,10, authenticatedUsers, ...
    API_DESCRIPTION = "<parameters description>", // with report type null, with userId null, with missing password, ...
    QUERY_PARAMS = "<QUERY_PARAMETERS>", // ?type=a, ?type=b&method=c, ?email=a@b.c&points=0&administrator=false, ...
    BODY = "<BODY_PARAMETERS>"; // {email:a.com}, {email:a.com, password:bcd},  ...

//E' più veloce sviluppare casi di test usando 'formatRequestJSON' che rende il codice più compatto e leggibile.
//Le variabili soprastanti vanno rimosse ed inserite direttamente come parametri del metodo (vedi esempio 'locateTrashcans.test.js').
let apiRequest = testUtility.formatRequestJSON(API_METHOD, API_PATH, API_DESCRIPTION, QUERY_PARAMS, BODY)

/*Non è necessario avviare il server.js per far funzionare questa test suite!
↓ > rimuovi la x dal metodo quando crei la tua Suite altrimenti verrà ignorata.*/
xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());
    
    let adminUser = true, //Se l'utente che sta eseguendo la richiesta è un admin
        tokenExpiration = 86400, //Tempo che ci mette il token a scadere in secondi
        token = testUtility.getJwtToken(adminUser, tokenExpiration/*, 682c459970094692410b318f*/); //può essere aggiunto un ID utente custom

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("MISSING_QUERY_PARAMETER") },
        _payload = apiRequest.BODY; //Il payload deve essere salvato in locale per evitare problemi di concorrenza

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    //console.log(fullApiAdress) //per debuggare l'adress dell'API e trovare eventuali errori
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
                          //  ↓ > sostituisci 'post' con il tuo metodo (API_METHOD)
        return request(app).post(fullAPIAdress)
        //.send(_payload) //usa solo se devi passare un body ad un post/put/patch
        .set('x-access-token', token).set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});