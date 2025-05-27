const express = require('express');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');
const Discount = require('../models/discount');

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE=false;

const API_V = process.env.API_VERSION;

router.get("/", async (req, res) => {
    if (req.query.type == "all"){
        if (req.loggedUser.administrator == true || TEST_MODE){
            if (LOG_MODE >= 1) console.log("Get all discounts request!")
            const {amount, discountType} = req.query;
            let query = {};
            query.redeemedBy = null
            if (discountType !== '') query.discountType = discountType;
            if (amount !== '') query.amount = {$gt: amount};
            let discountList = await Discount.find(query);
                discountList = discountList.map((discount) => {
                    return {
                        self: API_V + '/discounts/' + discount._id,
                        redeemedBy: discount.redeemedBy,
                        discountType: discount.discountType,
                        amount: discount.amount,
                        code: discount.code
                    };
                });
            res.status(200).json(discountList);
        }else
		    return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
    }else
        next();
});
router.get("/", async (req, res) => {
    if (req.query.type == "personal"){
        if (LOG_MODE >= 1) console.log("Get personal discount request!")
        let discountList
        try{
            discountList = await Discount.find({redeemedBy: req.loggedUser._id});
        }catch(err){
            return res.status(400).json({error: true, message: "Nessuno sconto in possesso"});
        }
        discountList = discountList.map((discount) => {
            return {
                self: API_V + '/discount/' + discount._id,
                redeemedBy: discount.redeemedBy,
                discountType: discount.discountType,
                amount: discount.amount,
                code: discount.code
            };
        });
        res.status(200).json(discountList);
    }else
        next();
});
router.get("/", async (req, res) => {
    if (req.query.type == "new"){
        if (LOG_MODE >= 1) console.log("Get discount request!")
        if(req.loggedUser.points<5000)
            return res.status(400).json({error: true, message: "Punti insufficienti"});
        const {discountType} = req.query;
        let query = {};
        query.redeemedBy = null
        if (discountType !== '') query.discountType = discountType;
        let discount
        try{
            discount = await Discount.findOne(query);
        }catch(err){
            return res.status(400).json({error: true, message: "Sconti terminati per questa categoria"});
        }
        let user = await AuthenticatedUser.findOne({_id: req.loggedUser._id});
        user.points = user.points-5000;
        discount.redeemedBy =user._id;
        user.save();
        discount.save();
        res.status(200).json(user);
    }else
        return res.status(400).json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
});

router.post("/",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Add discount request!")
        let discount = new Discount({
            discountType: req.body.discountType,
            amount: req.body.amount,
            code: req.body.code
        });
        discount = await discount.save();
        
        let discountId = discount._id;

        if (LOG_MODE >= 1) console.log('Discount saved successfully!');

        res.location(API_V + "/discounts/" + discountId).status(201).send();    
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        await Discount.deleteOne({ _id: req.params.id });
        if (LOG_MODE >= 1) console.log('Discount removed!')
        res.status(204).send()
    }
});
module.exports = router;