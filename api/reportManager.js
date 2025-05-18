const express = require('express');
const Report = require('../models/report');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');

const REPORT_RESOLVED_REWARD = 500;

const TEST_MODE = true

const ISSUE_REPORT_COOLDOWN_MIN = 1_440 //24h

//GET ALL REPORTS
router.get("/", async (req, res, next) => {
    if (req.query.type == "all"){
        if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
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
		    return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
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
router.put("/:id",  async (req, res, next) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        console.log("put report request from user "+req.loggedUser.email)

        let report;
        try{
            report = await Report.findById(req.params.id)
        }catch(err){
            return res.status(400).json({error: true, message: "L'ID INSERITO NON CORRISPONDE A NESSUN REPORT"});
        }

        req.report = report;
        
        next();
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.put("/:id",  async (req, res, next) => {
    if (req.report.resolved == req.body.resolved)
        return res.status(400).json({error: true, message: "IL REPORT E' GIA' STATO RISOLTO"});
    req.report.resolved = req.body.resolved;

    if (req.report.resolved){
        let authenticatedUser = await AuthenticatedUser.findById(req.report.issuerId);
        if(authenticatedUser){
            authenticatedUser.points += REPORT_RESOLVED_REWARD
            try{
                await authenticatedUser.save();
            }catch(err){
                return res.status(500).json(err);
            }
        }
        else
            return res.status(400).json({error: true, message: "NON ESISTE PROPRIETARIO DEL REPORT"});
    }
    
    try{
        req.report = await req.report.save();
    }catch(err){
        return res.status(500).json(err);
    }
    
    let reportId = req.report._id;

    console.log('Report saved successfully');

    res.location("reports/" + reportId).status(200).send();
});

//ADD NEW REPORT
router.post("",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        console.log("post report request from user "+req.loggedUser.email)

        let user = await AuthenticatedUser.findById(req.loggedUser.id)
        if (!user) 
            return res.status(500).json("Non è possibile risalire all'utente autenticato");
        if (user.banned)
            return res.status(401).json({error: true, message: "SEI STATO BANNATO E NON PUOI INVIARE REPORT!"});
        
        if (user.lastReportIssueDate && !TEST_MODE) { //TEST MODE: ACCESSIBILE IN OGNI CASO
            let difference = user.lastReportIssueDate.getTime() + ISSUE_REPORT_COOLDOWN_MIN * 60_000 - Date.now()
            if (difference > 0){
                let remainingMinutes = difference / 60_000;
                if (remainingMinutes > 60)
                    return res.status(400).json({error: true, message: "ULTIMO REPORT INVIATO MENO DI " + 
                        (ISSUE_REPORT_COOLDOWN_MIN / 60) + " ORE FA. RIPROVA FRA: " + (remainingMinutes / 60).toFixed(0) + " ORE"});
                else
                    return res.status(400).json({error: true, message: "ULTIMO REPORT INVIATO MENO DI " + 
                        (ISSUE_REPORT_COOLDOWN_MIN / 60) + " ORE FA. RIPROVA FRA: " + remainingMinutes.toFixed(0) + " MINUTI"});
            }
        }

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
            user.lastReportIssueDate = new Date(Date.now());
            console.log(user);
            await user.save();
        }catch(err){
            console.warn(err);
            return res.status(500).json(err);
        }
        
        let reportId = report._id;
        console.log('Report saved successfully');
        res.location("reports/" + reportId).status(201).send();
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

//DELETE REPORT
router.delete('/:id', async (req, res, next) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        if (req.query.type == "report"){
            console.log("delete report request from user "+req.loggedUser.email)

            try{
                await Report.deleteOne({ _id: req.params.id });
            }catch(err){
                return res.status(400).json({error: true, message: "L'ID INSERITO NON CORRISPONDE A NESSUN REPORT"});
            }
            console.log('report removed')
            res.status(204).send()
        }else 
            next();
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

//DELETE REPORTS OF USERID
router.delete('/:userId', async (req, res) => { 
    // SOPRA C'E' LA NEXT QUINDI NON SERVE IL CONTROLLO DELLE CREDENZIALI QUI!
    // !- NB: SAPPIAMO GIA' CHE CHI ARRIVA QUA DENTRO E' UN ADMIN -!
    console.log("delete reports of user " + req.params.userId + " request from user "+req.loggedUser.email)
    
    try{
        await Report.deleteMany({ issuerId: req.params.userId });
    }catch(err){
        return res.status(400).json({error: true, message: "ID UTENTE INSERITO INESISTENTE"});
    }

    console.log('all reports of requested user deleted')
    res.status(204).send()
});

//DELETE ALL REPORTS
router.delete('/', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){ //TEST MODE: ACCESSIBILE IN OGNI CASO
        console.log("delete all report request from user "+req.loggedUser.email)

        await Report.deleteMany({});
        console.log('all reports removed')
        res.status(204).send()
    }else
		return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

module.exports = router;