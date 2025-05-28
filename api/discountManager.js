const express = require('express');
const router = express.Router();
const mailProvider = require('./mailProvider')
const AuthenticatedUser = require('../models/authenticatedUser');
const Discount = require('../models/discount');
const error = require('../enums/errorCodes.cjs.js');

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE=false;

const API_V = process.env.API_VERSION;

router.get("/", async (req, res, next) => {
    if (req.query.type == "all" || req.query.type == "personal" ){
        if (LOG_MODE >= 1) console.log("Get all discounts request!")
        const {type, amount, isPercentage, discountType} = req.query;
        let query = {};
        query.redeemedBy = req.query.type == "all"? null : req.loggedUser.id
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
        next()
});

router.get("/", async (req, res) => {
    if (req.query.type == "new"){
        if (LOG_MODE >= 1) console.log("Get discount request!")
        let user = await AuthenticatedUser.findOne({_id: req.loggedUser.id});
        if(user.points<5000)
            return res.status(400).send(error("INFUFFICIENT_POINTS"))//.json({error: true, message: "Punti insufficienti"});
        const {type, amount, isPercentage, discountType} = req.query;
        let query = {};
        query.redeemedBy = null
        if (discountType !== '') query.discountType = discountType;
        if (amount !== '') query.amount = amount;
        if (isPercentage !== '') query.isPercentage = isPercentage;
        let discount
        try{
            discount = await Discount.findOne(query);
             if (!discount)
                return res.status(400).send(error("OUT_OF_STOCK"))//.json({error: true, message: "Sconti terminati per questa categoria"});
        }catch(err){
            return res.status(400).send(error("OUT_OF_STOCK"))//.json({error: true, message: "Sconti terminati per questa categoria"});
        }
        user.points = user.points-5000;
        discount.redeemedBy =user._id;
        const discountTypes= ["Fragrance","Toys","Steam","Amazon","Supermarket"]
        let mailOptions = {
            subject: '[GreenMap] Your redeemed code',
            text: `Your redeemed code is: ${discount.code}\n`+
                  `The amount is ${discount.amount}${discount.isPercentage?"%":"€"} valid only for ${discountTypes[discount.discountType]}\n`
        };
        try{
            mailProvider.sendMail(user.email, mailOptions.subject, mailOptions.text);
            user.save();
            discount.save();
            return res.location(API_V + "/discounts/" + discount._id).status(201).send();    
        }catch(err){
            return res.status(500).send(error("INTERNAL_ERROR"))//.json({error: true, message: "Internal server error"});
        }
    }else
        return res.status(400).send(error("MISSING_QUERY_PARAMETER"))//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
});

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
            return res.status(400).send(error("WRONG_DATA"))//.json({error: true, message: "discount has wrong data"});
        }
        let discountId = discount._id;

        if (LOG_MODE >= 1) console.log('Discount saved successfully!');

        res.location(API_V + "/discounts/" + discountId).status(201).send();    
    }else
		return res.status(401).send(error("UNAUTHORIZED"))//.json({error: true, message: 'Requesting user is not an administrator!'});
});

router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        await Discount.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Discount removed!')
        res.status(204).send()
    }else
		return res.status(401).send(error("UNAUTHORIZED"))//.json({error: true, message: 'Requesting user is not an administrator!'});
});

router.delete('/', async (req, res) => {
    await Discount.deleteMany({ redeemedBy: req.loggedUser.id });
    if (LOG_MODE >= 1) console.log('Discounts removed!')
    res.status(204).send()
});
module.exports = router;