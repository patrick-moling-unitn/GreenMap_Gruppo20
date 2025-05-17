const express = require('express');
const Report = require('../models/report');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');

const REPORT_RESOLVED_REWARD = 500;

//GET ALL REPORTS
router.get("/", async (req, res, next) => {
    if (req.query.type == "all"){
        if (req.loggedUser.administrator == true || true == true){ //TEST MODE: ACCESSIBILE IN OGNI CASO
            console.log("get all reports request")
            let reportList = await Report.find({});
            reportList = reportList.map((report) => {
                return {
                    self: '/reports/' + report.id,
                    issuerId: report.issuerId,
                    reportType: report.reportType,
                    reportDescription: report.reportDescription,
                    latitude: report.latitude,
                    longitude: report.longitude,
                    resolved: report.resolved
                };
            });
            res.status(200).json(reportList);
        }else
            return res.status(401).send({message: 'Requesting user is not an administrator!'});
    }else
        next();
});

//GET PERSONAL REPORTS
router.get("/", async (req, res) => {
    console.log("get all reports request from", req.loggedUser.id)

    let reportList = await Report.find({issuerId: req.loggedUser.id});
    reportList = reportList.map((report) => {
        return {
            self: '/reports/' + report.id,
            issuerId: report.issuerId,
            reportType: report.reportType,
            reportDescription: report.reportDescription,
            latitude: report.latitude,
            longitude: report.longitude,
            resolved: report.resolved
        };
    });
    res.status(200).json(reportList);
});


//UPDATE EXISTING REPORT RESOLUTION
router.put("/:id",  async (req, res) => {
    if (req.loggedUser.administrator == true || true == true){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        console.log("put report request from user "+req.loggedUser.email)

        let report = await Report.findOne({_id: req.params.id});
        if (report.resolved == req.body.resolved)
            return res.status(400).json({messagge: "IL REPORT E' GIA' STATO RISOLTO"});
        report.resolved = req.body.resolved;

        if (report.resolved){
            let authenticatedUser = await AuthenticatedUser.findOne({ _id: report.issuerId});
            if(authenticatedUser){
                authenticatedUser.points += REPORT_RESOLVED_REWARD
                try{
                    await authenticatedUser.save();
                }catch(err){
                    return res.status(500).json(err);
                }
            }
            else
                return res.status(400).json({messagge: "NON ESISTE PROPRIETARIO DEL REPORT"});
        }
        
        try{
            report = await report.save();
        }catch(err){
            return res.status(500).json(err);
        }
        
        let reportId = report._id;

        console.log('Report saved successfully');

        res.location("reports/" + reportId).status(200).send();
    }else
		return res.status(401).send({message: 'Requesting user is not an administrator!'});
});

//ADD NEW REPORT
router.post("",  async (req, res) => {
    if (req.loggedUser.administrator == true || true == true){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        console.log("post report request from user "+req.loggedUser.email)

        let report = new Report({
            issuerId: req.loggedUser.id,
            reportType: req.body.type,
            reportDescription: req.body.description,
            latitude: Number(req.body.latitude),
            longitude: Number(req.body.longitude),
            resolved: false
        });
        
        try{
            report = await report.save();
        }catch(err){
            return res.status(500).json(err);
        }
        
        let reportId = report._id;
        console.log('Report saved successfully');
        res.location("reports/" + reportId).status(201).send();
    }else
		return res.status(401).send({message: 'Requesting user is not an administrator!'});
});

//DELETE REPORT
router.delete('/:id', async (req, res) => {
    console.log("delete report request from user "+req.loggedUser.email)

    await Trashcan.deleteOne({ _id: req.params.id });
    console.log('report removed')
    res.status(204).send()
});

module.exports = router;