const request = require('supertest'); 
const app = require('../app.js');
const error = require('../enums/errorCodes.cjs.js');
const testUtility = require('./testUtility.js')
const RegisteringUser = require('../models/registeringUser');
const AuthenticatedUser = require('../models/authenticatedUser');

let apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"register with a wrong email", "<QUERY_PARAMETERS>", {email:"wrongmail.com", password:"123456789"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//FAIL: GOT STATUS CODE 200
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("EMAIL_CHOOSEN_NOT_VALID") }, _payload = apiRequest.BODY;

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send( _payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"register with duplicate email", "<QUERY_PARAMETERS>", {email:"example@gmail.com", password:"123456789"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//OK
    beforeAll(async () => {
        await testUtility.connectToDatabase(jest, app)
        let user = new AuthenticatedUser({
            email: "example@gmail.com",
            administrator: false,
            points: 0,
            banned: false,
            passwordHash: "123456789"
        });
        try{
            await user.save();
        }catch(err){
            //utente già in database
        }
    });
    afterAll(async () => await testUtility.closeDatabaseConnection());
    
    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("EMAIL_ALREADY_REGISTERED") },  _payload = apiRequest.BODY
    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, async () => {
        res = await request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"registration of a new user when the password prerequisites are not satisfied", "<QUERY_PARAMETERS>", {email:"example2@gmail.com", password:"badpwd"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("REGISTRATING_USER_INVALID_PASSWORD") }, _payload = apiRequest.BODY;

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send( _payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"Registration of a new user when the email field email is empty", "<QUERY_PARAMETERS>", {password:"badpsw"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//FAIL: GOT 500
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("MISSING_BODY_PARAMETER") }, _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload )
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"Registration of a new user when the password field password is empty", "<QUERY_PARAMETERS>", {email:"example3@gmail.com"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//FAIL: GOT 500
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("MISSING_BODY_PARAMETER") }, _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload )
        .set('Accept','application/json')
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"Registration of a new user when email and password are valid", "<QUERY_PARAMETERS>", {email:"example4@gmail.com", password:"123456789"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 200, _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload )
        .set('Accept','application/json')
        .expect(expectedHttpCode);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"Registration of a new user when email and password are valid", "<QUERY_PARAMETERS>", {email:"example5@gmail.com", password:"123456789"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 200, _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload )
        .set('Accept','application/json')
        .expect(expectedHttpCode);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"Registration of a new user when email and password are not valid", "<QUERY_PARAMETERS>", {email:"example6@gmail.com", password:"123456789"})

xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//OK
    beforeAll( () => testUtility.connectToDatabase(jest, app) );
    afterAll(async () => await testUtility.closeDatabaseConnection());

    let expectedHttpCode = 200,  _payload = apiRequest.BODY

    let fullAPIAdress = testUtility.getFullAPIadress(apiRequest.API_PATH, apiRequest.QUERY_PARAMS);
    test(apiRequest.API_METHOD+" "+fullAPIAdress+" "+apiRequest.API_DESCRIPTION, () => {
        return request(app).post(fullAPIAdress)
        .send(_payload)
        .set('Accept','application/json')
        .expect(expectedHttpCode);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"Registration of a new user when the verification code is not valid", "<QUERY_PARAMETERS>", {code: "123456"})
xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//OK
    var userId
    beforeAll(async () => {
        await testUtility.connectToDatabase(jest, app)
        let user = new RegisteringUser({
            passwordHash: "123456789",
            email: "example8@gmail.com",
            verificationCode: {
                code: 123456,
                expireDate: new Date(Date.now() + 60 * 1000)
            }
        });
        try{
            await user.save();
        }catch(err){
            //utente già in database
        }
        user=await RegisteringUser.findOne({email: "example8@gmail.com"})
        userId=user._id
    });
    afterAll(async () => {
        AuthenticatedUser.deleteOne({email: "example8@gmail.com"}) 
        await testUtility.closeDatabaseConnection()
    });

    let expectedHttpCode = 201,  _payload = apiRequest.BODY
    test(`POST /api/v2/registeringUsers/:id/code 2. Confirm code`, async () => {
        expect(userId).toBeDefined();
        await request(app)
        .post(`/api/v2/registeringUsers/${userId}/code`)
        .send(_payload)
        .set("Accept", "application/json")
        .expect(expectedHttpCode);
    });
});

apiRequest = testUtility.formatRequestJSON("POST", "registeringUsers", 
"Registration of a new user when the verification code is not valid", "<QUERY_PARAMETERS>", {code: ""})
xdescribe(apiRequest.API_METHOD + "/api/v2/"+apiRequest.API_PATH, () => {//OK
    var userId
    beforeAll(async () => {
        await testUtility.connectToDatabase(jest, app)
        let user = new RegisteringUser({
            passwordHash: "123456789",
            email: "example9@gmail.com",
            verificationCode: {
                code: 123456,
                expireDate: new Date(Date.now() + 60 * 1000)
            }
        });
        try{
            await user.save();
        }catch(err){
            //utente già in database
        }
        user=await RegisteringUser.findOne({email: "example9@gmail.com"})
        userId=user._id
    });
    afterAll(async () => {
        RegisteringUser.deleteOne({email: "example9@gmail.com"}) 
        await testUtility.closeDatabaseConnection()
    });

    let expectedHttpCode = 400, expectedHttpJSON = { errorCode: error("REGISTRATION_CODE_INVALID") },  _payload = apiRequest.BODY
    test(`POST /api/v2/registeringUsers/:id/code 2. Confirm code`, async () => {
        expect(userId).toBeDefined();
        await request(app)
        .post(`/api/v2/registeringUsers/${userId}/code`)
        .send(_payload)
        .set("Accept", "application/json")
        .expect(expectedHttpCode, expectedHttpJSON);
    });
});