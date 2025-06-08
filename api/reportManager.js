const express = require('express');
const Report = require('../models/report');
const router = express.Router();
const geolibUtility = require('./getolibUtility.js');

const AuthenticatedUser = require('../models/authenticatedUser');
const error = require('../enums/errorCodes.cjs.js');

const REPORT_RESOLVED_REWARD = 500;

const TEST_MODE = false;
const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH

const ISSUE_REPORT_COOLDOWN_MIN = 1_440 //24h

const API_V = process.env.API_VERSION;

/**
 * RELATIVE PATH)
 *  .../reports/REPORT_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to view information
 *  about a specific report
 * PARAMS)
 *  id: the identifier of the report you want to get information from
 * SUCCESSFUL RETURNS)
 *  report: the report found
 */
router.get("/:id", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("get report request")
        let report = await Report.findById(req.params.id);
        if (!report)
            return res.status(400).json({ errorCode: error("NO_MATCHING_REPORT_ID") })

        res.status(200).json(report);
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../reports/
 * DESCRIPTION)
 *  the method permits a requesting user to get the reports within a specified range from 
 *  his positon. If the query parameters are empty the request will get forwarded to 
 *  the next method.
 * PARAMS)
 *  query.position: the origin point where the search begins
 *  query.distance: the maximum distance a report can have from the origin
 *  query.solved: whether to search just for reports already resolved or not.
 *                If left empty no filter is applied.
 * SUCCESSFUL RETURNS)
 *  reportList: the list of reports which position is inside the searched circle
 */
router.get("/", async (req, res, next) => {
    if (req.query.position && req.query.distance){
        if (req.loggedUser.administrator == false)
            return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
        const [lat, lng] = req.query.position.split(',').map(Number);
        if (LOG_MODE >= 1) console.log("Get all reports near: " + req.query.position + " max distance (meters): " + req.query.distance)

        if (isNaN(lat) || isNaN(lng))
            return res.status(400).json({ errorCode: error("COORDINATES_CHOOSEN_NOT_VALID") });
        
        let userPosition = geolibUtility.latLngToJSON(lat, lng);
        
        let query = req.query.solved ? { resolved: req.query.solved } : {},
            reportList = await Report.find(query);
        reportList = geolibUtility.filterClosestElementsOnList(reportList, userPosition, req.query.distance);
        res.status(200).json(reportList);
    }else
        next();  //CONTINUES BELOW<!!!>
});

/**
 * RELATIVE PATH)
 *  .../reports/
 * DESCRIPTION)
 *  the method permits a requesting user to get his personal reports or, 
 *  if administrator, to get the reports of all users
 * PARAMS)
 *  query.type: discriminates the request method the user wants to make
 *              either by returning the reports submitted by all users "all"
 *              or forwarding the request to the next method "personal"
 * SUCCESSFUL RETURNS)
 *  reportList: the list of reports submitted by all users
 */
router.get("/", async (req, res, next) => {
    if (req.query.type == "all"){
        if (req.loggedUser.administrator == true || TEST_MODE){
            if (LOG_MODE >= 1) console.log("get all reports request")
            let reportList = await Report.find({});
            reportList = reportList.map((report) => {
                return {
                    self: API_V + '/reports/' + report.id,
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
		    return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
    }else if (req.query.type == "personal")
        next(); //CONTINUES BELOW<!!!>
    else
        return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER") })
});

/**
 * DESCRIPTION)
 *  the method permits a requesting user to get his personal reports
 * SUCCESSFUL RETURNS)
 *  reportList: the list of reports submitted by the user who's making the request
 */
router.get("/", async (req, res) => {
    if (LOG_MODE >= 1) console.log("get all reports request from", req.loggedUser.id)

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


/**
 * RELATIVE PATH)
 *  .../reports/REPORT_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to update
 *  a report resolution status. It's split in 2 methods to reduce complexity
 * PARAMS)
 *  id: the identifier of the report to update
 *  body.resolved: the resolution status that you want to set
 */
router.put("/:id",  async (req, res, next) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("put report request from user "+req.loggedUser.email)

        let report;
        try{
            report = await Report.findById(req.params.id)
        }catch(err){
            return res.status(400).json({ errorCode: error("NO_MATCHING_REPORT_ID") })
        }

        req.report = report;
        
        next(); //CONTINUES BELOW<!!!>
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to update a report 
 *  resolution and rewards the user who's submitted the report (if body.resolved
 *  is set to true)
 * NOTES)
 *  we checked if the user is administrator above so there's no need to do that again.
 *  The method shares the parameters of the one above
 */
router.put("/:id",  async (req, res) => {
    if (req.report.resolved == req.body.resolved)
        return res.status(400).json({ errorCode: error("ALREADY_RESOLVED_REPORT") })
    req.report.resolved = req.body.resolved;

    if (req.report.resolved){
        let authenticatedUser = await AuthenticatedUser.findById(req.report.issuerId);
        if(authenticatedUser){
            authenticatedUser.points += REPORT_RESOLVED_REWARD
            try{
                await authenticatedUser.save();
            }catch(err){
                return res.status(500).json({ errorMessage: err });
            }
        }
        else
            return res.status(400).json({ errorCode: error("NO_MATCHING_REPORT_ID") })
    }
    
    try{
        req.report = await req.report.save();
    }catch(err){
        return res.status(500).json({ errorMessage: err });
    }
    
    let reportId = req.report._id;

    if (LOG_MODE >= 2) console.log('Report saved successfully');

    res.location(API_V + "reports/" + reportId).status(200).send();
});

/**
 * RELATIVE PATH)
 *  .../reports/
 * DESCRIPTION)
 *  the method permits a requesting user to submit a new report if 
 *  the last submission time is more than REPORT_COOLDOWN_MIN minutes ago
 * PARAMS)
 *  body.type: the type of report submitted
 *  body.description: the description of the report submitted
 *  body.latitude: the first coordinate of the report submitted
 *  body.longitude: the second coordinate of the report submitted
 */
router.post("",  async (req, res) => {
    if (LOG_MODE >= 1) console.log("post report request from user "+req.loggedUser.email)

    let user = await AuthenticatedUser.findById(req.loggedUser.id)
    if (!user) 
        return res.status(500).json({ errorCode: error("NO_MATCHING_REPORT_ID") })
    if (user.banned)
        return res.status(401).json({ errorCode: error("BANNED") })
    
    if (user.lastReportIssueDate && !TEST_MODE) {
        let difference = user.lastReportIssueDate.getTime() + ISSUE_REPORT_COOLDOWN_MIN * 60_000 - Date.now()
        if (difference > 0){
            let remainingMinutes = difference / 60_000;
            if (remainingMinutes > 60)
                return res.status(400).json({errorMessage: "ULTIMO REPORT INVIATO MENO DI " + 
                    (ISSUE_REPORT_COOLDOWN_MIN / 60) + " ORE FA. RIPROVA FRA: " + (remainingMinutes / 60).toFixed(0) + " ORE"});
            else
                return res.status(400).json({errorMessage: "ULTIMO REPORT INVIATO MENO DI " + 
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
        if (LOG_MODE >= 3) console.log(user);
        await user.save();
    }catch(err){
        if (LOG_MODE >= 3) console.warn(err);
        return res.status(500).json({ errorMessage: err });
    }
    
    let reportId = report._id;
    if (LOG_MODE >= 2) console.log('Report saved successfully');
    res.location("reports/" + reportId).status(201).send();
});

/**
 * RELATIVE PATH)
 *  .../reports/REPORT_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to delete a specific report by id
 * PARAMS)
 *  id: the identifier of the report to delete
 */
router.delete('/:id', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("delete report request from user "+req.loggedUser.email)

        try{
            await Report.deleteOne({ _id: req.params.id });
        }catch(err){
            return res.status(400).json({ errorCode: error("NO_MATCHING_REPORT_ID") })
        }
        if (LOG_MODE >= 2) console.log('report removed')
        res.status(204).send()
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../reports/
 * DESCRIPTION)
 *  the method permits a requesting user to delete all his reports or, if administrator,
 *  to delete all the reports submitted either by a specific user or all the users
 * PARAMS)
 *  query.type: discriminates whether to delete all reports associated to a certain user 
 *              identifier "userReports" or to delete all reports submitted by the users "all"
 *  req.body.userId: the identifier of the user whose reports you want to delete. You can 
 *                   delete your own ones but to delete reports of others you need admin status
 */
router.delete('/', async (req, res) => { 
    if (req.query.type == "userReports" && (req.loggedUser.id == req.body.userId || req.loggedUser.administrator))
    {
        if (LOG_MODE >= 1) console.log("delete reports of user " + req.body.userId + " request from user "+req.loggedUser.email)
        
        try{
            await Report.deleteMany({ issuerId: req.body.userId });
        }catch(err){
            return res.status(400).json({ errorCode: error("NO_MATCHING_AUTHENTICATED_USER_ID") });
        }

        if (LOG_MODE >= 2) console.log('all reports of requested user deleted')
        res.status(204).send()
    }else if (req.query.type == "all")
        next(); //CONTINUES BELOW<!!!>
    else
        return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER") })
});

/**
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator,
 *  to delete all the reports submitted by the users
 */
router.delete('/', async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("delete all report request from user "+req.loggedUser.email)

        await Report.deleteMany({});
        if (LOG_MODE >= 2) console.log('all reports removed')
        res.status(204).send()
    }else
		return res.status(401).json({ errorCode: error("UNAUTHORIZED") });
});

module.exports = router;