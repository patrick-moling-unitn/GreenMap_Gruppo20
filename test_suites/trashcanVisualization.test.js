const request = require('supertest'); 
const app = require('../app.js');
const error = require('../enums/errorCodes.cjs.js');
const testUtility = require('./testUtility.js')
const TrashcanType = require('../enums/trashcanType.cjs.js')

let apiRequest = testUtility.formatRequestJSON("GET", "trashcans/190,190", 
                "get closest trashcan using invalid coordinates", "?type="+TrashcanType.PLASTIC)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //FAIL: GOT STATUS CODE 200
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("COORDINATES_CHOOSEN_NOT_VALID") }

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).get(fullAPIAdress)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

apiRequest = testUtility.formatRequestJSON("GET", "trashcans/0,0", 
            "get closest trashcan using valid coordinates", "?type="+TrashcanType.PLASTIC)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 200, expectedHttpJSON = { }

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    console.log(fullAPIAdress)
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, async () => {
        const response = await request(app).get(fullAPIAdress).set('Accept','application/json')

        expect(response.status).toBe(expectedHttpCode)
        expect(response.body).toHaveProperty("latitude")
        expect(response.body).toHaveProperty("longitude")
    });
});

apiRequest = testUtility.formatRequestJSON("GET", "trashcans/0,0", 
            "get closest trashcan while there are none in the Database", "?type="+TrashcanType.PLASTIC)

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 404, expectedHttpJSON = { }

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).get(fullAPIAdress)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

apiRequest = testUtility.formatRequestJSON("GET", "trashcans/0,0", 
            "get closest trashcan with invalid type", "?type="+'batteries')

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => { //OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 404, expectedHttpJSON = { }

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).get(fullAPIAdress)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});