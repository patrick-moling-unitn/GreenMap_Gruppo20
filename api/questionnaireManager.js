const express = require('express');
const router = express.Router();
const mailProvider = require('./mailProvider')
const questionnaireUtility = require('./questionnaireUtility')

const AuthenticatedUser = require('../models/authenticatedUser');
const QuestionType = require('../enums/questionType.cjs')
const Question = require('../models/question');
const Answer = require('../models/answer');
const error = require('../enums/errorCodes.cjs.js');

const LOG_MODE = 2; //0: NONE; 1: MINIMAL; 2: MEDIUM; 3: HIGH
const TEST_MODE=true;

const QUESTIONNAIRE_SUBMITTED_REWARD = 1000;
const QUESTIONNAIRE_MIN_QUESTION_COUNT = 4;

const QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN = 1_440 //24h

const API_V = process.env.API_VERSION;

//GET A QUESTIONNAIRE (N RANDOM QUESTIONS) TO COMPILE 
router.get("/", async (req, res) => {
    let start = new Date(Date.now());
    if (LOG_MODE >= 2) console.log("[Get questionnaire] request started at "+ (start.getSeconds() * 1000 + start.getMilliseconds()))
    let questionList = await Question.find({}),
    userAnswerList = await Answer.find({submitterId: req["loggedUser"].id});

    questionList = questionnaireUtility.getNotAnsweredQuestions(userAnswerList, questionList);

    if (LOG_MODE >= 2){
        let finish = new Date(Date.now());
        console.log("[Get questionnaire] request finished at "+(finish.getSeconds() * 1000 + finish.getMilliseconds()));
        console.warn("Query speed: "+(finish - start)+"ms");
    }

    questionList = questionnaireUtility.getRandomQuestions(questionList, QUESTIONNAIRE_MIN_QUESTION_COUNT);

    if (questionList != null){ // getRandomQuestions restituisce null se  numberOfQuestions > questionList.length
        questionList = questionList.map(element => {
            return {
                self: API_V + '/questionnaires/' + element._id,
                question: element.question,
                questionType: element.questionType,
                options: element.options,
            };
        });
        res.status(200).json(questionList);
    }else
        res.status(400).json({ errorCode: error("ALL_ANSWERED") })
});

//GET ALL ANSWERS
router.get("/answers", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (req.query.method == "email" || req.query.method == "browser") {
            if (LOG_MODE >= 1) console.log("Get all submitted answers request!")

            let answerList = await Answer.find({}), questionList = await Question.find({});
            questionList = questionnaireUtility.getQuestionsWithAnswerData(questionList, answerList);

            if (LOG_MODE >= 3) console.log(questionList);

            if (req.query.method == "browser")
                res.status(200).json(questionList);
            else{
                let mailText = 'The following data shows all the questionnaire\'s answers organized by questions' + '\n';
                mailText += questionnaireUtility.formatQuestionsForMail(questionList);

                let mailOptions = {
                    subject: '[GreenMap] Questionnaire\'s answers',
                    text: mailText
                };
                mailProvider.sendMail(req["loggedUser"].email, mailOptions.subject, mailOptions.text);

                res.status(200).send();
            }
        }else
            return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER") })//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//GET ALL QUESTIONS
router.get("/questions", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all questions request!")

        let questionsList = await Question.find({});
        questionsList = questionsList.map((element) => {
            return {
                self: API_V + '/questionnaires/' + element._id,
                question: element.question,
                questionType: element.questionType,
                options: element.options
            };
        });
        res.status(200).json(questionsList);
    }else 
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//GET ALL ANSWERS TO A CERTAIN QUESTION
router.get("/answers/:questionId", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all submitted answers to a specific question request!")

        let answerList = await Answer.find({questionId: req.params.questionId});
        res.status(200).json(answerList);
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//SUBMIT A QUESTIONNAIRE 
router.post("/",  async (req, res) => {
    if (LOG_MODE >= 1) console.log("Compile questionnaire request!")

    let user = await AuthenticatedUser.findById(req['loggedUser'].id);
    if (user) {
        if (user.lastQuestionnaireCompilationDate && !TEST_MODE) {
            let difference = user.lastQuestionnaireCompilationDate.getTime() + QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN * 60_000 - Date.now()
            if (difference > 0){
                let remainingMinutes = difference / 60_000;
                if (remainingMinutes > 60)
                    return res.status(400).json({errorMessage: "ULTIMO QUESTIONARIO INVIATO MENO DI " + 
                        (QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN / 60) + " ORE FA. RIPROVA FRA: " + (remainingMinutes / 60).toFixed(0) + " ORE"});
                else
                    return res.status(400).json({errorMessage: "ULTIMO QUESTIONARIO INVIATO MENO DI " + 
                        (QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN / 60) + " ORE FA. RIPROVA FRA: " + remainingMinutes.toFixed(0) + " MINUTI"});
            }
        }else if (TEST_MODE)
            console.warn("Bypassato il check sul lastQuestionnaireCompilationDate!!!");

        let submittedAnswers = req.body.answers;
        for (let i=0; i < submittedAnswers.length; i++){
            var answer = new Answer({ //let qui non funziona. Problemi di allocazione di memoria!!! var OBBLIGATORIO
                submitterId: user._id,
                questionId: submittedAnswers[i].questionId,
                answer: submittedAnswers[i].answer,
                gibberishLevel: submittedAnswers[i].gibberishLevel
            });

            try {
                await answer.save();
            } catch(err) {
                return res.status(500).json({errorMessage: err});
            }
        }

        try {
            user.lastQuestionnaireCompilationDate = new Date(Date.now());
            user.points += QUESTIONNAIRE_SUBMITTED_REWARD;
            await user.save();

            return res.location(API_V+"/questionnaires/"+answer._id+"?type=answer").status(201).send();
        } catch (err){
            return res.status(500).json({ errorMessage: err});
        }
    }else
        return res.status(401).json({ errorCode: error("USER_NOT_FOUND") })//.json({error: true, message: "THE USER WHO SUBMITTED THE ANSWERS DOESN'T EXIST ON THE DATABASE!"});
});

//Extract options from a question. Returns -1 if options are not valid.
function getOptionsFromQuestion(question){
    if (question.questionType == QuestionType.CLOSE_ENDED){
        if (question.options)
            return question.options;
        else
            return -1;
    }
    return null;
}

//POST A NEW QUESTIONS
router.post("/questions",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE) //TEST MODE: ACCESSIBILE IN OGNI CASO
    {
        let submittedQuestion = req.body.question;
        if (submittedQuestion){
            let options = getOptionsFromQuestion(submittedQuestion);
            if (getOptionsFromQuestion == -1) return res.status(400).json({ errorCode: error("MISSING_QUESTION_OPTIONS") })

            let question = new Question({
                question: submittedQuestion.question,
                questionType: submittedQuestion.questionType
            });
            if (options) question.options = options;
            
            try {
                await question.save();
                console.log("Question saved successfully");
                return res.location(API_V+"/questionnaires/"+question._id+"?type=question").status(201).json({id: question._id});
            } catch(err) {
                return res.status(500).json({errorMessage: err});
            }
        }
        else
            return res.status(400).json({ errorCode: error("MISSING_QUESTION") })//.json({error: true, message: "NON E' STATA PASSATA UNA QUESTION AL METODO!"});
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//Aggiorna una question con del nuovo testo, tipo di domanda oppure opzioni fornite dall'amministratore
router.put("/questions/:questionId",  async (req, res) => {
    let submittedQuestion = req.body.question;
    if (submittedQuestion){
        let options = getOptionsFromQuestion(submittedQuestion), question;
        if (getOptionsFromQuestion == -1) return res.status(400).json({ errorCode: error("MISSING_QUESTION_OPTIONS") })
        
        try {
            question = await Question.findById(req.params.questionId);
        } catch(err) {
            return res.status(500).json({errorMessage: err});
        }

        question.question = submittedQuestion.question;
        question.questionType = submittedQuestion.questionType;
        if (options) question.options = options;
        
        try {
            await question.save();
            console.log("Question updated successfully");
            return res.status(200).send();
        } catch(err) {
            return res.status(500).json({errorMessage: err});
        }
    }
    else
        return res.status(400).json({ errorCode: error("MISSING_QUESTION") })//.json({error: true, message: "NON E' STATA PASSATA UNA QUESTION AL METODO!"});
});

//Cancella una question e tutte le sue risposte a cascata
router.delete("/questions/:questionId",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        try {
            await Question.deleteOne({ _id: req.params.questionId })
            await Answer.deleteMany({ questionId: req.params.questionId }) //cancella le risposte a cascata
        } catch(err) {
            return res.status(500).json({errorMessage: "An error occurred while deleting the question ",err});
        }

        if (LOG_MODE >= 1) console.log('Question successfully removed!');
        res.status(204).send();    
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//[lavoro di raffaele, commit: d1f1ba8d7c44647c32c0218da98a90f4a129ff01]
//Cancella tutte le risposte di un certo utente a cascata 
router.delete("answers/:issuerId", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Delete all answers of user " + req.params.issuerId);

        try {
            await Answer.deleteMany({ submitterId: req.params.issuerId })
        }catch(err){
            return res.status(400).json({ errorCode: error("ID_NOT_FOUND") })//.json({error: true, message: "ID not found."});
        }
        res.status(204).send();
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//DELETE ALL ANSWERS
router.delete("/answers",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await Answer.deleteMany({})
        if (LOG_MODE >= 1) console.log('All questionnaire\'s answers removed!');
        res.status(204).send();
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })//.json({error: true, message: 'Requesting user is not an administrator!'});
});

module.exports = router;