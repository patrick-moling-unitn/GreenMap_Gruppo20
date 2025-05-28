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

router.get("/", async (req, res, next) => {
    if (req.query.type == "questionnaire"){
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
            return res.status(200).json(questionList);
        }else
            return res.status(400).send(error("ALL_ANSWERED"))//.json({error: true, message: "You have compiled all the available questions. Please come back later!"});
    }else if (req.loggedUser.administrator == true || TEST_MODE){
        if (req.query.type == "answer" && (req.query.method == "email" || req.query.method == "browser") ){
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
        }else if (req.query.type == "question"){
            next();
        }else
            return res.status(400).send(error("MISSING_QUERY_PARAMETER"))//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
    }else
        return res.status(401).send(error("UNAUTHORIZED"))//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//GET ALL QUESTIONS
router.get("/", async (req, res) => {
    // SOPRA C'E' LA NEXT QUINDI NON SERVE IL CONTROLLO DELLE CREDENZIALI QUI!
    // !- NB: SAPPIAMO GIA' CHE CHI ARRIVA QUA DENTRO E' UN ADMIN -!
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
});

//GET ALL ANSWERS TO A CERTAIN QUESTION
router.get("/:questionId", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all submitted answers to a specific question request!")

        let answerList = await Answer.find({questionId: req.params.questionId});
        res.status(200).json(answerList);
    }else
        return res.status(401).send(error("UNAUTHORIZED"))//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//Richiesta con query parameter (type) che permette di inviare un questionario oppure aggiungere una domanda
router.post("/",  async (req, res, next) => {
    if (req.query.type == "questionnaire"){
        if (LOG_MODE >= 1) console.log("Compile questionnaire request!")

        let user = await AuthenticatedUser.findById(req['loggedUser'].id);
        if (user) {
            if (user.lastQuestionnaireCompilationDate && !TEST_MODE) {
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
                    return res.status(500).json({error: true, message: "Couldn't save answer: " + err});
                }
            }

            try {
                user.lastQuestionnaireCompilationDate = new Date(Date.now());
                user.points += QUESTIONNAIRE_SUBMITTED_REWARD;
                await user.save();

                return res.location(API_V+"/questionnaires/"+answer._id+"?type=answer").status(201).send();
            } catch (err){
                return res.status(500).json({error: true, message: "Couldn't save user: " + err});
            }
        }else
            return res.status(401).send(error("USER_NOT_FOUND"))//.json({error: true, message: "THE USER WHO SUBMITTED THE ANSWERS DOESN'T EXIST ON THE DATABASE!"});
    }else if (req.query.type == "question"){
        if (req.loggedUser.administrator == true || TEST_MODE) //TEST MODE: ACCESSIBILE IN OGNI CASO
            next();
        else
            return res.status(401).send(error("UNAUTHORIZED"))//.json({error: true, message: 'Requesting user is not an administrator!'});
    }else
        return res.status(400).send(error("MISSING_QUERY_PARAMETER"))//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
});

function getOptionsFromQuestion(question){
    if (question.questionType == QuestionType.CLOSE_ENDED){
        if (question.options)
            return question.options;
        else
            return res.status(400).json({error: true, message: ("NON E' STATO PASSATO",
                "L'ARRAY DI OPTION ALLA QUESTION DI TIPO",question.questionType,"!")});
    }
    return null;
}

//Chi arriva qua è un amministratore (verificato) che vuole inserire una nuova domanda
router.post("/",  async (req, res) => {
    let submittedQuestion = req.body.question;
    if (submittedQuestion){
        let options = getOptionsFromQuestion(submittedQuestion);

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
            return res.status(500).json({error: true, message: "An error occurred while saving the question ",err});
        }
    }
    else
        return res.status(400).send(error("MISSING_QUESTION"))//.json({error: true, message: "NON E' STATA PASSATA UNA QUESTION AL METODO!"});
});

//Aggiorna una question con del nuovo testo, tipo di domanda oppure opzioni fornite dall'amministratore
router.put("/:questionId",  async (req, res) => {
    let submittedQuestion = req.body.question;
    if (submittedQuestion){
        let options = getOptionsFromQuestion(submittedQuestion), 
            question;
        
        try {
            question = await Question.findById(req.params.questionId);
        } catch(err) {
            return res.status(500).json({error: true, message: "An error occurred while getting the question ",err});
        }

        question.question = submittedQuestion.question;
        question.questionType = submittedQuestion.questionType;
        if (options) question.options = options;
        
        try {
            await question.save();
            console.log("Question updated successfully");
            return res.status(200).send();
        } catch(err) {
            return res.status(500).json({error: true, message: "An error occurred while saving the question ",err});
        }
    }
    else
        return res.status(400).send(error("MISSING_QUESTION"))//.json({error: true, message: "NON E' STATA PASSATA UNA QUESTION AL METODO!"});
});

//Cancella una question e tutte le sue risposte a cascata
router.delete("/:questionId",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (req.query.type == "question"){
            try {
                await Question.deleteOne({ _id: req.params.questionId })
                await Answer.deleteMany({ questionId: req.params.questionId }) //cancella le risposte a cascata
            } catch(err) {
                return res.status(500).json({error: true, message: "An error occurred while deleting the question ",err});
            }

            if (LOG_MODE >= 1) console.log('Question successfully removed!');
            res.status(204).send();
        }else if (req.query.type == "userAnswers"){
            next();
        }else
            return res.status(400).send(error("MISSING_QUERY_PARAMETER"))//.json({error: true, message: "NON E' STATO PASSATO UN QUERY PARAMETER PREVISTO ALLA FUNZIONE!"});
    }else
        return res.status(401).send(error("UNAUTHORIZED"))//.json({error: true, message: 'Requesting user is not an administrator!'});
});

//[lavoro di raffaele, commit: d1f1ba8d7c44647c32c0218da98a90f4a129ff01]
//Cancella tutte le risposte di un certo utente a cascata 
router.delete("/:issuerId", async (req, res) => {
    // SOPRA C'E' LA NEXT QUINDI NON SERVE IL CONTROLLO DELLE CREDENZIALI QUI!
    if (LOG_MODE >= 1) console.log("Delete all answers of user " + req.params.issuerId);

    try {
        await Answer.deleteMany({ submitterId: req.params.issuerId })
    }catch(err){
        return res.status(400).send(error("ID_NOT_FOUND"))//.json({error: true, message: "ID not found."});
    }
    return res.status(204).send();
});

router.delete("/",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await Answer.deleteMany({})
        if (LOG_MODE >= 1) console.log('All questionnaire\'s answers removed!');
        res.status(204).send();
    }else
        return res.status(401).send(error("UNAUTHORIZED"))//.json({error: true, message: 'Requesting user is not an administrator!'});
});

module.exports = router;