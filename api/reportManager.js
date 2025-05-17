const express = require('express');
const Report = require('../models/report');
const router = express.Router();

//GET ALL REPORTS
router.get("/", async (req, res) => {
    console.log("get all reports request")
    let reportList = await Report.find({});
    reportList = reportList.map((report) => {
        return {
            self: '/reports/' + report.id,
            issuerId: report.issuerId,
            latitude: report.latitude,
            longitude: report.longitude,
            resolved: report.resolved
        };
    });
    res.status(200).json(reportList);
});

//UPDATE EXISTING REPORT RESOLUTION
router.put("/:id",  async (req, res) => {
    console.log("put report request from user "+req.loggedUser.email)

    let report = await Report.find({_id: req.params.id});
    report.resolved = req.params.resolved;
    
    report = await report.save();
    
    let reportId = report._id;

    console.log('Report saved successfully');

    res.location("reports/" + reportId).status(200).send();
});

//ADD NEW REPORT
router.post("",  async (req, res) => {
    console.log("post report request from user "+req.loggedUser.email)

    let report = new Report({
            issuerId: req.loggedUser.id,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            resolved: false
    });
    
    report = await report.save();
    
    let reportId = report._id;
    console.log('Report saved successfully');
    res.location("reports/" + reportId).status(201).send();
});

//DELETE REPORT
router.delete('/:id', async (req, res) => {
    console.log("delete report request from user "+req.loggedUser.email)

    await Trashcan.deleteOne({ _id: req.params.id });
    console.log('report removed')
    res.status(204).send()
});

module.exports = router;