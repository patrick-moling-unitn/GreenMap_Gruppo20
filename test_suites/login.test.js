const request = require('supertest'); 
const app = require('../app.js');
const error = require('../enums/errorCodes.cjs.js');
const testUtility = require('./testUtility.js')

let payload = {email: "abra.cadabra@gmail.com", password: "12345678"}
let apiRequest = testUtility.formatRequestJSON("POST", "authenticatedUsers/", 
                "execute login request with non existent email adress", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 500
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("AUTHENTICATED_USER_EMAIL_NOT_FOUND") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {email: null, password: "12345678"}
apiRequest = testUtility.formatRequestJSON("POST", "authenticatedUsers/", 
                "execute login request with invalid email adress", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 500
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("AUTHENTICATED_USER_EMAIL_NOT_FOUND") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {email: "patrick.moling@studenti.unitn.it", password: null}
apiRequest = testUtility.formatRequestJSON("POST", "authenticatedUsers/", 
                "execute login request with invalid account's password", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT ERRORCODE "WRONG_PASSWORD"
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("WRONG_DATA") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {email: "patrick.moling@studenti.unitn.it", password: "12345678"}
apiRequest = testUtility.formatRequestJSON("POST", "authenticatedUsers/", 
                "execute login request with wrong account's password", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("WRONG_PASSWORD") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {email: "jesehedo@dcpa.net", password: "jesehedo@dcpa.net"}
apiRequest = testUtility.formatRequestJSON("POST", "authenticatedUsers/", 
                "execute login request with a banned account", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("AUTHENTICATED_USER_BANNED") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {email: "patrick.moling@studenti.unitn.it", password: "testtest"}
apiRequest = testUtility.formatRequestJSON("POST", "authenticatedUsers/", 
                "execute login request with correct credentials", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 200, expectedHttpJSON = { },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, async () => {
        const response = await request(app).post(fullAPIAdress).send(_payload).set('Accept','application/json')

        expect(response.status).toBe(expectedHttpCode)
        expect(response.body).toHaveProperty("authToken")
    });
});