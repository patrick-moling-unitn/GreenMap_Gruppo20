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
const EXECUTE_QUESTIONNAIRE_REQUEST_BENCHMARK=true;

const QUESTIONNAIRE_SUBMITTED_REWARD = 1000;
const QUESTIONNAIRE_MIN_QUESTION_COUNT = 4;

const QUESTIONNAIRES_DATA_TEXT_VIA_EMAIL = false;

const QUESTIONNAIRE_SUBMISSION_COOLDOWN_MIN = 1_440 //24h

const API_V = process.env.API_VERSION;

/**
 * RELATIVE PATH)
 *  .../questionnaires/
 * DESCRIPTION)
 *  the method permits a requesting user to recieve a new questionnaire if there 
 *  are questions available (i.e. there are at least MIN_QUESTION_COUNT questions)
 * SUCCESSFUL RETURNS)
 *  questionList: the list of randomly choosen questions (i.e. a questionnaire)
 */
router.get("/", async (req, res) => {
    let start;
    if (EXECUTE_QUESTIONNAIRE_REQUEST_BENCHMARK){
        start = new Date(Date.now());
        console.log("[Get questionnaire] request started at "+ (start.getSeconds() * 1000 + start.getMilliseconds()));
    }
    let questionList = await Question.find({}),
    userAnswerList = await Answer.find({submitterId: req["loggedUser"].id});

    questionList = questionnaireUtility.getNotAnsweredQuestions(userAnswerList, questionList);

    if (EXECUTE_QUESTIONNAIRE_REQUEST_BENCHMARK){
        let finish = new Date(Date.now());
        console.log("[Get questionnaire] request finished at "+(finish.getSeconds() * 1000 + finish.getMilliseconds()));
        console.warn("Query speed: "+(finish - start)+"ms");
    }

    questionList = questionnaireUtility.getRandomQuestions(questionList, QUESTIONNAIRE_MIN_QUESTION_COUNT);

    if (questionList != null){ // getRandomQuestions restituisce null se  numberOfQuestions > questionList.length
        questionList = questionList.map(element => {
            return {
                self: API_V + '/questionnaires/questions/' + element._id,
                question: element.question,
                questionType: element.questionType,
                options: element.options,
            };
        });
        res.status(200).json(questionList);
    }else
        res.status(400).json({ errorCode: error("ALL_ANSWERED") })
});

/**
 * RELATIVE PATH)
 *  .../questionnaires/answers
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to get all
 *  answers submitted by the users who compiled questionnaires
 * PARAMS)
 *  query.method: discriminates the request method the user wants to make
 *                either by sending the answers via email "email" or returning
 *                the list of questions with answers "browser"
 * SUCCESSFUL RETURNS)
 *  questionList: the list of questions containing the answers and statistics
 */
router.get("/answers", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (req.query.method == "email" || req.query.method == "browser") {
            if (LOG_MODE >= 1) console.log("Get all submitted answers request!")

            let answerList = await Answer.find({}), questionList = await Question.find({}),
                includeFullOpenAnswerData = req.query.method == "browser";
            questionList = questionnaireUtility.getQuestionsWithAnswerData(questionList, answerList, includeFullOpenAnswerData);

            if (LOG_MODE >= 3) console.log(questionList);

            if (req.query.method == "browser")
                res.status(200).json(questionList);
            else{
                let mailText = "";
                if (QUESTIONNAIRES_DATA_TEXT_VIA_EMAIL) {
                    mailText += 'The following data shows all the questionnaire\'s answers organized by questions' + '\n';
                    mailText += questionnaireUtility.formatQuestionsForMail(questionList);
                }

                mailText += "The questionnaire's answers data has been attached below."
                let csvTest = questionnaireUtility.formatQuestionsForCSV(questionList);

                let mailOptions = {
                    subject: '[GreenMap] Questionnaire\'s answers',
                    text: mailText
                };
                let date = new Date(), day = date.getDate(), month = date.getMonth()+1;
                date = day+"-"+month+"-"+date.getFullYear();
                mailProvider.sendMailWithCSVAttachment(req["loggedUser"].email, mailOptions.subject, 
                    mailOptions.text, 'questionnaire_data_'+date+'.csv', csvTest);

                res.status(200).send();
            }
        }else
            return res.status(400).json({ errorCode: error("MISSING_QUERY_PARAMETER") })
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * DA CORREGGERE.....
 */
router.get("/answers/:questionId", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all submitted answers to a specific question request!")

        let answerList = await Answer.find({questionId: req.params.questionId});
        res.status(200).json(answerList);
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../questionnaires/questions
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to get all
 *  the questions currently available for questionnaires
 * SUCCESSFUL RETURNS)
 *  questionList: the list of questions
 */
router.get("/questions", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Get all questions request!")

        let questionsList = await Question.find({});
        questionsList = questionsList.map((element) => {
            return {
                self: API_V + '/questionnaires/questions/' + element._id,
                question: element.question,
                questionType: element.questionType,
                options: element.options
            };
        });
        res.status(200).json(questionsList);
    }else 
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../questionnaires/
 * DESCRIPTION)
 *  the method permits a requesting user to submit questionnaire's answers if 
 *  the last submission time was done more than SUBMISSION_COOLDOWN_MIN minutes ago
 * SUCCESSFUL RETURNS)
 *  questionList: the list of randomly choosen questions (i.e. a questionnaire)
 */
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

            return res.location(API_V+"/questionnaires/answers/"+answer._id).status(201).send();
        } catch (err){
            return res.status(500).json({ errorMessage: err});
        }
    }else
        return res.status(401).json({ errorCode: error("USER_NOT_FOUND") })
});

//Extract options from a question. Returns -1 if options are not valid.
function getOptionsFromQuestion(question){
    if (question.questionType == QuestionType.CLOSE_ENDED){
        if (question.options) //Se la risposta è di tipo chiuso DOBBIAMO avere opzioni valide
            return question.options;
        else
            return -1;
    }
    return null; //Se la risposta non è di tipo chiuso non ci interessano le opzioni
}

/**
 * RELATIVE PATH)
 *  .../questionnaires/questions
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to submit a new questionnaire's
 *  question if valid that will from now on be used for questionnaires
 * PARAMS)
 *  body.question: contains the text of the question, the questionType and question's options
 * SUCCESSFUL RETURNS)
 *  id: the identifier of the question just created used by the client for eventual updates
 */
router.post("/questions",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE)
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
                return res.location(API_V+"/questionnaires/questions/"+question._id).status(201).json({id: question._id});
            } catch(err) {
                return res.status(500).json({errorMessage: err});
            }
        }
        else
            return res.status(400).json({ errorCode: error("MISSING_QUESTION") })
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../questionnaires/questions/QUESTION_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to 
 *  update an existing questionnaire's question
 * PARAMS)
 *  questionId: identifier of the question which properties you want to change
 *  body.question: contains the updated text of the question, the new questionType 
 *                 and question's options
 */
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
        return res.status(400).json({ errorCode: error("MISSING_QUESTION") })
});

/**
 * RELATIVE PATH)
 *  .../questionnaires/questions/QUESTION_IDENTIFIER
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to delete 
 *  an existing questionnaire's question and all its cascading answers
 * PARAMS)
 *  questionId: identifier of the question that you want to delete
 */
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
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * DA CORREGGERE.....
 */
//[lavoro di raffaele, commit: d1f1ba8d7c44647c32c0218da98a90f4a129ff01]
router.delete("answers/:issuerId", async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        if (LOG_MODE >= 1) console.log("Delete all answers of user " + req.params.issuerId);

        try {
            await Answer.deleteMany({ submitterId: req.params.issuerId })
        }catch(err){
            return res.status(400).json({ errorCode: error("ID_NOT_FOUND") })
        }
        res.status(204).send();
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

/**
 * RELATIVE PATH)
 *  .../questionnaires/answers
 * DESCRIPTION)
 *  the method permits a requesting user, if administrator, to 
 *  delete all questionnaire's answers
 */
router.delete("/answers",  async (req, res) => {
    if (req.loggedUser.administrator == true || TEST_MODE){
        await Answer.deleteMany({})
        if (LOG_MODE >= 1) console.log('All questionnaire\'s answers removed!');
        res.status(204).send();
    }else
        return res.status(401).json({ errorCode: error("UNAUTHORIZED") })
});

module.exports = router;