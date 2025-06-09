const express = require('express');
const router = express.Router();
const mailProvider = require('./mailProvider')
const AuthenticatedUser = require('../models/authenticatedUser');
const Discount = require('../models/discount');
const DiscountTypes = require('../enums/discountType.cjs')
const error = require('../enums/errorCodes.cjs.js');

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE=false;

const API_V = process.env.API_VERSION;
const POINTS_NEEDED = 5000;
/**
 * RELATIVE PATH)
 *  .../dicounts/
 * DESCRIPTION)
 *  the method permits a requesting user to retrieve:
 *  1. all unclaimed discounts -> code hidden
 *  2. user's own discount (associated to their user id) -> code shown
 *  3. a new discount from the unclaimed list
 *  all querys can include searching parameters
 * PARAMS)
 *  query.type: discriminates the type of request the user wants to make
 *              either getting "all" or "personal" discounts
 * 
 *  the following query parameters can be left empty '' and will be ignored
 * 
 *  query.amount: the (least) amount of the discount you want to search for
 *  query.isPercentage: whether you want to be a percentage or cash
 *  query.discountType: the type of the product you are searching
 * SUCCESSFUL RETURNS)
 *  discountList: the list of discounts matching the searched criteria
 */
router.get("/", async (req, res, next) => {
    if (req.query.type == "all" || req.query.type == "personal" && req.issuer !== 'undefined'){
        const {type, amount, isPercentage, discountType} = req.query;
        let query = {};
        query.redeemedBy = req.query.type == "all"? null : req.issuer
        if (discountType !== '') query.discountType = discountType;
        if (amount !== '') query.amount = {$gte: amount};
        if (isPercentage !== '') query.isPercentage = isPercentage;
        let discountList 
        discountList = await Discount.find(query);
        discountList = discountList.map((discount) => {
            return {
                self: API_V + '/discounts/' + discount._id,
                discountType: discount.discountType,
                amount: discount.amount,
                isPercentage: discount.isPercentage,
                code: req.query.type == "all"? "##################" : discount.code
            };
        });
        res.status(200).json(discountList);
    }else
        next()//CONTINUES BELOW<!!!>
});

/**
 * RELATIVE PATH)
 *  .../dicounts/
 * DESCRIPTION)
 *  the method permits a requesting user to retrieve:
 *  1. all unclaimed discounts -> code hidden
 *  2. user's own discount (associated to their user id) -> code shown
 *  3. a new discount from the unclaimed list
 *  all querys can include searching parameters
 * SUCCESSFUL RETURNS)
 *  discountList: the list of discounts matching the searched criteria
 * NOTES)
 *  we checked if the user wants to retrieve all/his discounts above so there's no need to do that again
 */
router.get("/", async (req, res) => {
    if (req.query.type == "new" && req.issuer !== 'undefined' ){
        if (LOG_MODE >= 1) console.log("Get discount request!")
        let user = await AuthenticatedUser.findOne({_id: req.loggedUser.id});
        if(user.points<POINTS_NEEDED)//l'utente deve avere almeno 5000 punti per procedere
            return res.status(400).json({ errorCode: error("INFUFFICIENT_POINTS") })
        const {type, amount, isPercentage, discountType} = req.query;
        let query = {};
        query.redeemedBy = null
        if (discountType !== '') query.discountType = discountType;
        if (amount !== '') query.amount = amount;
        if (isPercentage !== '') query.isPercentage = isPercentage;
        let discount
        try{
            discount = await Discount.findOne(query);
             if (!discount)//se nessuno sconto che soddisfi i parametri di ricerca è stato trovato segnala errore
                return res.status(400).json({ errorCode: error("OUT_OF_STOCK") })
        }catch(err){
            return res.status(400).json({ errorCode: error("OUT_OF_STOCK") })
        }
        user.points = user.points-POINTS_NEEDED;
        discount.redeemedBy =user._id;
        let mailOptions = {
            subject: '[GreenMap] Your redeemed code',
            text: `Your redeemed code is: ${discount.code}\n`+
                  `The amount is ${discount.amount}${discount.isPercentage?"%":"€"} valid only for ${DiscountTypes[discount.discountType]}\n`
        };
        try{//mando il nuovo sconto all'utente e salvo le modifiche
            mailProvider.sendMail(user.email, mailOptions.subject, mailOptions.text);
            user.save();
            discount.save();
            return res.location(API_V + "/discounts/" + discount._id).status(201).send();    
        }catch(err){
            return res.status(500).json({ errorCode: error("INTERNAL_ERROR") })//.json({error: true, message: "Internal server error"});
        }
    }else
        return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER") })//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
});

/**
 * RELATIVE PATH)
 *  .../discounts/
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to add a new discount
 *  (if valid) to the unclaimed discounts list
 * PARAMS)
 *  body.amount: the amount of the discount 
 *  body.isPercentage: whether you want to be a percentage or cash
 *  body.discountType: the type of the product to apply the discount
 *  body.code: the code to retrieve the discount
 */
router.post("/",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Add discount request!")
        let discount = new Discount({
            discountType: req.body.discountType,
            amount: req.body.amount,
            isPercentage: req.body.isPercentage,
            code: req.body.code
        });
        try{
            discount = await discount.save();
        }catch(err){
            return res.status(400).json({ errorCode: error("WRONG_DATA") })
        }
        let discountId = discount._id;

        if (LOG_MODE >= 1) console.log('Discount saved successfully!');

        res.location(API_V + "/discounts/" + discountId).status(201).send();    
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});
/**
 * RELATIVE PATH)
 *  .../discounts/USER_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to delete
 *  an existing discount by using its identifier.
 * PARAMS)
 *  id: identifier of the discount
 */
router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await Discount.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Discount removed!')
        res.status(204).send()
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});
/**
 * RELATIVE PATH)
 *  .../discounts/
 * DESCRIPTION)
 *  the method permits a requesting user, to delete all of his discounts
 */
router.delete('/', async (req, res) => {
    await Discount.deleteMany({ redeemedBy: req.loggedUser.id });
    if (LOG_MODE >= 1) console.log('Discounts removed!')
    res.status(204).send()
});
module.exports = router;