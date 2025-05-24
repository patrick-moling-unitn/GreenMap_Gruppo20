const express = require('express');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');
const Answer = require('../models/answer');

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE=false;

const API_V = process.env.API_VERSION;

router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all submitted answers request!")

        let answerList = await Answer.find({});
        res.status(200).json(answerList);
    }else
        return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.post("/",  async (req, res) => {
    if (LOG_MODE >= 1) console.log("Compile questionnaire request!")

    let user = await AuthenticatedUser.findById(req['loggedUser'].id);
    if (user) {
        let submittedAnswers = req.body.answers;
        let answerCount = await Answer.countDocuments(); // Possibile problema di concorrenza? 
                                                         // Molto improbabile, ma risolto per sicurezza con *partialUserId*
        let partialUserId = req['loggedUser'].id.substring(req['loggedUser'].id.length - 5)

        for (let i=0; i < submittedAnswers.length; i++){
            let answer = new Answer({
                _id: String(submittedAnswers[i].questionId) + String(answerCount) + String(partialUserId),
                submitterId: user.id,
                questionId: submittedAnswers[i].questionId,
                answer: submittedAnswers[i].response,
                gibberishLevel: submittedAnswers[i].gibberishLevel
            });

            try {
                await answer.save();
                answerCount++;
            } catch(err) {
                return res.status(500).json({message: "Couldn't save answer: " + err});
            }
        }
    }else
        return res.status(401).json({message: "THE USER WHO SUBMITTED THE ANSWERS DOESN'T EXIST ON THE DATABASE!"});
});

module.exports = router;