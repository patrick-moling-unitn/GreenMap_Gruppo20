const request = require('supertest'); 
const app = require('../app.js');
const error = require('../enums/errorCodes.cjs.js');
const testUtility = require('./testUtility.js')
const ReportType = require('../enums/reportType.cjs.js')

let payload = { resolved: false }, reportId = "683b145a54693e6fb9c2a921"
let apiRequest = testUtility.formatRequestJSON("PUT", "reports/"+reportId, 
                "resolve a report without being logged in", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 401, expectedHttpJSON = { errorCode: error("MISSING_TOKEN") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).put(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = { resolved: false }
reportId = "683b145a54693e6fb9c2a921"
apiRequest = testUtility.formatRequestJSON("PUT", "reports/"+reportId, 
                "resolve a report as a non administrator user", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = false,
        tokenExpiration = 86400,
        token = testUtility.getJwtToken(adminUser, tokenExpiration);

    let expectedHttpCode = 401, expectedHttpJSON = { errorCode: error("UNAUTHORIZED") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).put(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = { resolved: false }
reportId = null
apiRequest = testUtility.formatRequestJSON("PUT", "reports/"+reportId, 
                "resolve a report with an invalid report id", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = true,
        tokenExpiration = 86400,
        adminId = "682b2047bb6989ab4bfc1fe1",
        token = testUtility.getJwtToken(adminUser, tokenExpiration, adminId);

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("NO_MATCHING_REPORT_ID") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).put(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = { resolved: null }
reportId = "683b145a54693e6fb9c2a921"
apiRequest = testUtility.formatRequestJSON("PUT", "reports/"+reportId, 
                "resolve a report with a missing resolved value", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 200
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = true,
        tokenExpiration = 86400,
        adminId = "682b2047bb6989ab4bfc1fe1",
        token = testUtility.getJwtToken(adminUser, tokenExpiration, adminId);

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("WRONG_DATA") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).put(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = { resolved: -1 }
reportId = "683b145a54693e6fb9c2a921"
apiRequest = testUtility.formatRequestJSON("PUT", "reports/"+reportId, 
                "resolve a report with a missing resolved value", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 500
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = true,
        tokenExpiration = 86400,
        adminId = "682b2047bb6989ab4bfc1fe1",
        token = testUtility.getJwtToken(adminUser, tokenExpiration, adminId);

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("WRONG_DATA") },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).put(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

payload = { resolved: false }
reportId = "683b145a54693e6fb9c2a921"
apiRequest = testUtility.formatRequestJSON("PUT", "reports/"+reportId, 
                "resolve a report with a missing resolved value", "<QUERY_PARAMETERS>", payload)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let adminUser = true,
        tokenExpiration = 86400,
        adminId = "682b2047bb6989ab4bfc1fe1",
        token = testUtility.getJwtToken(adminUser, tokenExpiration, adminId);

    let expectedHttpCode = 200, expectedHttpJSON = { },
        _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).put(fullAPIAdress)
        .send(_payload)
        .set('x-access-token', token)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});