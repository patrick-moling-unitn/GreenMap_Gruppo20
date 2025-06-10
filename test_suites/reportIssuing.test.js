const request = require('supertest'); 
const app = require('../app.js');
const error = require('../enums/errorCodes.cjs.js');
const testUtility = require('./testUtility.js')
const ReportType = require('../enums/reportType.cjs.js')

let payload = {
    type: ReportType.TRASHCAN_LOCATION_SUGGESTION, description: "description", latitude: 0, longitude: 0, 
}
let apiRequest = testUtility.formatRequestJSON("POST", "reports/", 
                "submit new report without being logged in", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 401, expectedHttpJSON = { errorCode: error("MISSING_TOKEN") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {
    type: null, description: "description", latitude: 0, longitude: 0, 
}
apiRequest = testUtility.formatRequestJSON("POST", "reports/", 
                "submit new report with a missing type", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 201
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = false,
        tokenExpiration = 86400,
        token = testUtility.getJwtToken(adminUser, tokenExpiration);

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("WRONG_DATA") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token).set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {
    type: -1, description: "description", latitude: 0, longitude: 0, 
}
apiRequest = testUtility.formatRequestJSON("POST", "reports/", 
                "submit new report with an invalid type", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 201
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = false,
        tokenExpiration = 86400,
        token = testUtility.getJwtToken(adminUser, tokenExpiration);

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("WRONG_DATA") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token).set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {
    type: ReportType.TRASHCAN_LOCATION_SUGGESTION, description: null, latitude: 0, longitude: 0, 
}
apiRequest = testUtility.formatRequestJSON("POST", "reports/", 
                "submit new report with a missing description", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 201
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = false,
        tokenExpiration = 86400,
        token = testUtility.getJwtToken(adminUser, tokenExpiration);

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("WRONG_DATA") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token).set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = {
    type: ReportType.TRASHCAN_LOCATION_SUGGESTION, description: "description", latitude: 0, longitude: 0, 
}
apiRequest = testUtility.formatRequestJSON("POST", "reports/", 
                "submit new report without waiting 24 hours from the previous one", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = false,
        tokenExpiration = 86400,
        token = testUtility.getJwtToken(adminUser, tokenExpiration);

    let expectedHttpCode = 400, expectedHttpJSON = { },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, async () => {
        let response;
        for (let i=1; i<=2; i++) //esegue due richieste consecutive
            response = await request(app).post(fullAPIAdress).send(_payload)
                .set('x-access-token', token).set('Accept','application/json')

        expect(response.status).toBe(expectedHttpCode)
        expect(response.body).toHaveProperty("errorMessage")
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "reports/", "submit new report with "+
    "a valid type and description", "<QUERY_PARAMETERS>", payload) //usa lo stesso payload della richiesta sopra

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = false,
        tokenExpiration = 86400,
        token = testUtility.getJwtToken(adminUser, tokenExpiration);

    let expectedHttpCode = 201, expectedHttpJSON = { },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token).set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});