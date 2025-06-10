const express = require('express');
const bcrypt = require('bcrypt');
const mailProvider = require('./mailProvider')

const RegisteringUser = require('../models/registeringUser');
const AuthenticatedUser = require('../models/authenticatedUser');
const error = require('../enums/errorCodes.cjs.js');

const router = express.Router();
//costanti
const EMAIL_CODE_EXPIRATION_TIME_MIN=15
const MIN_USER_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = Number(process.env.HASHING_SALT_ROUNDS);

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE = true;

const API_V = process.env.API_VERSION;

/**
 * RELATIVE PATH)
 *  .../registratingUsers/
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, 
 *  to get all registering users
 * SUCCESSFUL RETURNS)
 *  usersList: the list of all registrating users
 */
router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all registering user request!")
        let usersList = await RegisteringUser.find({});
        usersList = usersList.map((user) => {
            return {
                self: API_V + '/registeringUsers/' + user._id,
                email: user.email,
                passwordHash: user.passwordHash
            };
        });
        res.status(200).json(usersList);
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../registratingUsers/
 * DESCRIPTION)
 *  the method permits an anonymous requesting user to start
 *  the registration process of a new account
 * PARAMS)
 *  body.email: the email which you want to register the account with
 *  body.password: the password you want to associate with the account
 * SUCCESSFUL RETURNS)
 *  id: the identifier of the registering user used by the client for the confirmation
 */
router.post("/",  async (req, res) => {
    //Errore precedente: pensare che /registeringUsers/REG_USER_ID/code venisse indirizzato a questo metodo. E' falso!
    if(req.body.email || req.body.password){ 
        alreadyRegisteringEmail = await RegisteringUser.findOne({ email: req.body.email.toLowerCase()});
        let verificationCode = alreadyRegisteringEmail ? alreadyRegisteringEmail.verificationCode : null;
        if (verificationCode){ //IF USER IS ALREADY VERIFYING
            if (verificationCode.expireDate<new Date()){ //IF THE VERIFICATION CODE EXPIRED DELETE THE USER
                await RegisteringUser.deleteOne(alreadyRegisteringEmail);
                alreadyRegisteringEmail = null;
            }else{  //IF THE VERIFICATION CODE IS VALID CHECK THE PASSWORD AND RETURN HIS USER ID
                bcrypt.compare(req.body.password, alreadyRegisteringEmail.passwordHash, function (err, result) {
                    if (result == true)
                        res.status(200).json({ id: alreadyRegisteringEmail._id });
                    else
                        res.status(400).json({ errorCode: error("WRONG_PASSWORD") });
                });
                return; //return dentro bcrypt.compare non impedisce al metodo di coninuare!
            }
        }
        let email = req.body.email.toLowerCase()
        if(email.search("@")==-1 || email.search(".")==-1)
            return res.status(400).json({ errorCode: error("EMAIL_CHOOSEN_NOT_VALID") });
        if(alreadyRegisteringEmail)
            return res.status(400).json({ errorCode: error("REGISTRATING_USER_DUPLICATED_REQUEST") });
        alreadyExistingEmail = await AuthenticatedUser.findOne({ email: req.body.email.toLowerCase()});
        if(alreadyExistingEmail)
            return res.status(400).json({ errorCode: error("EMAIL_ALREADY_REGISTERED") });
        if (req.body.password.length < MIN_USER_PASSWORD_LENGTH)
            return res.status(400).json({ errorCode: error("REGISTRATING_USER_INVALID_PASSWORD") });

        let reguser = new RegisteringUser({
            email: req.body.email,
            passwordHash: await bcrypt.hash(req.body.password, SALT_ROUNDS),
            verificationCode: {
                code: Math.floor(100000 + Math.random() * 900000).toString(),
                expireDate: new Date(Date.now() + EMAIL_CODE_EXPIRATION_TIME_MIN * 60 * 1000)
            }
        });

        let mailOptions = {
            subject: '[GreenMap] Verify your email',
            text: 'Your verification code is: '+ reguser.verificationCode.code + '\n' +
                  'The verification code will expire in '+EMAIL_CODE_EXPIRATION_TIME_MIN+' minutes.'
        };
        mailProvider.sendMail(req.body.email, mailOptions.subject, mailOptions.text);
        try{
            await reguser.save();
            res.location(API_V + '/registeringUsers/' + reguser._id).status(201).json({id: reguser._id});
        }catch(err){
            return res.status(500).json({ errorMessage: err });
        }
    }else
        return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETERS") });
});

/**
 * RELATIVE PATH)
 *  .../registratingUsers/REG_USER_IDENTIFIER/code
 * DESCRIPTION)
 *  the method permits an anonymous requesting user, having a user identifier, to complete
 *  the registration request of his account by confirming the code sent to his personal email
 * PARAMS)
 *  id: the user identifier of the account you want to confirm the registration
 *  body.code: the code that was sent to your email adress
 * NOTES)
 *  the method proceeds executing below if previous checks are successful
 */
router.post("/:id/code",  async (req, res, next) => {
    const verifyinguser = await RegisteringUser.findById(req.params.id);
    if(!verifyinguser)
        return res.status(400).json({ errorCode: error("INVALID_REGISTRATION_REQUEST") });
    if(verifyinguser.verificationCode.expireDate<new Date()){
        await RegisteringUser.deleteOne({ _id: req.params.id });
        return res.status(400).json({ errorCode: error("REGISTRATION_CODE_EXPIRED") });
    }
    if(verifyinguser.verificationCode.code != req.body.code)
        return res.status(400).json({ errorCode: error("REGISTRATION_CODE_INVALID") });
    req['registeringUser'] = verifyinguser;
    next(); //CONTINUES BELOW<!!!>
});

/**
 * DESCRIPTION)
 *  the method converts the registering user into a new authenticated user since
 *  it has verified the code above. The temporary registrating user will be deleted.
 * NOTES)
 *  the method shares the parameters of the one above
 */
router.post("/:id/code",  async (req, res) => {
    const newuser = req['registeringUser'];
	let user = new AuthenticatedUser({
        email: newuser.email,
        administrator: false,
        points: 0,
        banned: false,
        passwordHash: newuser.passwordHash
    });
    await RegisteringUser.deleteOne({_id: req.params.id});
    try{
        await user.save();
        if (LOG_MODE >= 1) console.log('Registering user created!');
        return res.location(API_V + '/authenticatedUsers/' + user._id).status(201).send();
    }catch(err){
        return res.status(500).json({ errorMessage: err });
    }
});

/**
 * RELATIVE PATH)
 *  .../registratingUsers/REG_USER_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to
 *  delete a user who's carrying a registration process
 * PARAMS)
 *  id: the user identifier of the account you want to delete
 */
router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await AuthenticatedUser.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Registering user removed!');
        res.status(204).send();
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../registratingUsers/
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to
 *  delete all users carrying a registration process
 */
router.delete('/', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await RegisteringUser.deleteMany({})
        if (LOG_MODE >= 1) console.log('All registering users removed!');
        res.status(204).send();
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

module.exports = router;