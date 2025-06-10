const mongoose = require('mongoose');
const jwt = require('jsonwebtoken'); 

class TestUtility {
    getFullAPIadress(API_PATH, QUERY_PARAMS){
        let fullAPIAdress = "/api/v2/"+API_PATH;
        if (QUERY_PARAMS && QUERY_PARAMS != "<QUERY_PARAMETERS>") fullAPIAdress += QUERY_PARAMS
        return fullAPIAdress;
    }
    async connectToDatabase(jest, app) {
        jest.setTimeout(8000);
        app.locals.db = await mongoose.connect(process.env.DATABASE_URL);
    }
    async closeDatabaseConnection() {
        await mongoose.connection.close(true); 
    }
    getJwtToken(adminUser, tokenExpiration, customUserId){
        let userId = customUserId ? customUserId : "682c459970094692410b318f", //ID esistente per superare i check su alcune API
            payload = {id: userId, email: 'John@mail.com', administrator: adminUser, expiresIn: tokenExpiration}
        return jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: tokenExpiration} ); //creazione auth token
    }
    formatRequestJSON(IN_API_METHOD, IN_API_PATH, IN_API_DESCRIPTION, IN_QUERY_PARAMS, IN_BODY_PARAMS){
        return  { 
                    API_METHOD: IN_API_METHOD, 
                    API_PATH: IN_API_PATH, 
                    API_DESCRIPTION: IN_API_DESCRIPTION,
                    QUERY_PARAMS: IN_QUERY_PARAMS,
                    BODY: IN_BODY_PARAMS
                }
    }
}

testUtility = new TestUtility();

module.exports = testUtility;