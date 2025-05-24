const express = require('express');
const router = express.Router();

const AuthenticatedUser = require('../models/authenticatedUser');
const Answer = require('../models/answer');

const LOG_MODE = 1; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE=true;

const QUESTIONNAIRE_SUBMITTED_REWARD = 500;

const QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN = 1_440 //24h

const API_V = process.env.API_VERSION;

router.get("/", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all submitted answers request!")

        let answerList = await Answer.find({});
        res.status(200).json(answerList);
    }else
        return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.get("/:questionId", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all submitted answers for certain questionId request!")

        let answerList = await Answer.find({questionId: req.params.questionId});
        res.status(200).json(answerList);
    }else
        return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

router.post("/",  async (req, res) => {
    if (LOG_MODE >= 1) console.log("Compile questionnaire request!")

    let user = await AuthenticatedUser.findById(req['loggedUser'].id);
    if (user) {
        if (user.lastQuestionnaireCompilationDate) /* && !TEST_MODE)*/ { //TEST MODE: ACCESSIBILE IN OGNI CASO
            let difference = user.lastQuestionnaireCompilationDate.getTime() + QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN * 60_000 - Date.now()
            if (difference > 0){
                let remainingMinutes = difference / 60_000;
                if (remainingMinutes > 60)
                    return res.status(400).json({error: true, message: "ULTIMO QUESTIONARIO INVIATO MENO DI " + 
                        (QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN / 60) + " ORE FA. RIPROVA FRA: " + (remainingMinutes / 60).toFixed(0) + " ORE"});
                else
                    return res.status(400).json({error: true, message: "ULTIMO QUESTIONARIO INVIATO MENO DI " + 
                        (QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN / 60) + " ORE FA. RIPROVA FRA: " + remainingMinutes.toFixed(0) + " MINUTI"});
            }
        }

        let submittedAnswers = req.body.answers;
        let answerCount = await Answer.countDocuments(); // Possibile problema di concorrenza? -!-Obsoleto, rimosso prossimo commit-!-
                                                         // Molto improbabile, ma risolto per sicurezza con *partialUserId*
        let partialUserId = req['loggedUser'].id.substring(req['loggedUser'].id.length - 5)  // -!-Obsoleto, rimosso prossimo commit-!-

        for (let i=0; i < submittedAnswers.length; i++){
            let answer = new Answer({
                // Non penso sia necessario sovrascrivere l'_id di default
                // i benefici sono nulli per ricercare una risposta ad una domanda
                // conviene di più fare una query su answer.questionId a questo punto
                //_id: String(submittedAnswers[i].questionId) + String(answerCount) + String(partialUserId),
                submitterId: user.id,
                questionId: submittedAnswers[i].questionId,
                answer: submittedAnswers[i].answer,
                gibberishLevel: submittedAnswers[i].gibberishLevel
            });

            try {
                await answer.save();
                answerCount++; // -!-Obsoleto, rimosso prossimo commit-!-
            } catch(err) {
                return res.status(500).json({error: true, message: "Couldn't save answer: " + err});
            }
        }

        try {
            user.lastQuestionnaireCompilationDate = new Date(Date.now());
            user.points += QUESTIONNAIRE_SUBMITTED_REWARD;
            await user.save();

            return res.status(200).send();
        } catch (err){
            return res.status(500).json({error: true, message: "Couldn't save user: " + err});
        }
    }else
        return res.status(401).json({error: true, message: "THE USER WHO SUBMITTED THE ANSWERS DOESN'T EXIST ON THE DATABASE!"});
});

router.delete("/",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await Answer.deleteMany({})
        if (LOG_MODE >= 1) console.log('All questionnaire\'s answers removed!');
        res.status(204).send();
    }else
        return res.status(401).json({error: true, message: 'Requesting user is not an administrator!'});
});

module.exports = router;