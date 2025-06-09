<template>
    <div class="adaptive-margin-body">
    <h1>Compile Questionnaire</h1>
    
    <div v-if="questions.length > 0">
    <div class="primary-color p-4 mt-4">
    <div v-for="(question, index) in questions" :key="index" :class="index == 0 ? '' : 'mt-4'">
        <div id="openEndedQuestion" v-if="question.questionType==0"> <!-- OPEN_ENDED -->
            <p>{{ question.question }}</p>

            <div class="input-group">
            <textarea class="form-control" v-model="submittedAnswers[index].answer" aria-label="With textarea"></textarea>
            </div>
        </div>
        <div id="ratingScaleQuestion" v-else-if="question.questionType==2"> <!-- RATING_SCALE -->
            <p>{{ question.question }}</p>
            <div>
                <div class="form-check form-check-inline" v-for="option in ratingQuestionOptions">
                <input :id="'inlineRadio'+option" v-model="submittedAnswers[index].answer" class="form-check-input" type="radio" :name="'radio'+question.questionId" :value="option">
                <label class="form-check-label" :for="'inlineRadio'+option">{{ option }}</label>
                </div>
            </div>
        </div>
        <div id="dichotomousQuestion" v-else-if="question.questionType==3"> <!-- DICHOTOMOUS -->
            <p>{{ question.question }}</p>
            <div class="form-check" v-for="option in dichotomousQuestionOptions">
            <input class="form-check-input" v-model="submittedAnswers[index].answer" type="radio" :name="'radio'+question.questionId" :id="'radioDefault'+question.questionId" :value="option">
            <label class="form-check-label" :for="'radioDefault'+option">
                {{ option }}
            </label>
            </div>
        </div>
        <div id="closeEndedQuestion" v-else-if="question.questionType==1"> <!-- CLOSE_ENDED -->
            <p>{{ question.question }}</p>
            <div class="form-check" v-for="option in question.options">
            <input class="form-check-input" v-model="submittedAnswers[index].answer" type="radio" :name="'radio'+question.questionId" :id="'radio'+question.questionId" :value="option">
            <label class="form-check-label" :for="'radioDefault'+option">
                {{ option }}
            </label>
            </div>
        </div>
    </div>
    </div>
    <button type="button" class="btn btn-outline-primary m-4 align-self-start" @click="submitQuestionnaire">Submit Questionnaire</button>
    </div>
    <LoadingSpinner v-if="loadingQuestionnaire"></LoadingSpinner>
    <h5 v-else class="mt-4 mb-4">No questionnaires available at the moment</h5>
    </div>
</template>

<script>
import isGibberish from 'is-gibberish';
import UrlManager from '@/urlManager'
import TokenManager from '@/tokenManager'
import EventBus from '@/EventBus'
import QuestionType from '@enum/questionType.esm';
import QuestionOption from '@enum/questionOption.esm';
import ErrorCodes from '@enum/errorCodesDecoded.esm';
import LoadingSpinner from './LoadingSpinner.vue';

    export default {
        components: {
            LoadingSpinner
        },
        mounted(){
            // DELETE ALL QUESTIONNAIRES'S ANSWERS CODE
            /*    fetch(`${UrlManager()}/questionnaires`, {
                    method: "DELETE",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                })
            */
            this.requestQuestionnaire();
        },
        data() {
            return {
                MAXIMUM_ACCEPTED_GIBBERISH_LEVEL: .8,
                GIBBERISH_OPTIONS: { returnScore: true, sensitivity: 0.111 },
                LOG_LEVEL: 1, //0: NONE, 1: MIN, 2: MID, 3: HIGH
                dichotomousQuestionOptions: QuestionOption.DICHOTOMOUS,
                ratingQuestionOptions: QuestionOption.RATING_SCALE,
                submittedAnswers: [],
                questions: [],
                loadingQuestionnaire: false,
            }
        },
        methods: {
            addNewQuestion(newQuestionId, newQuestion, newQuestionType, newOptions){
                let question = { questionId: newQuestionId, question: newQuestion, 
                    questionType: newQuestionType, options: newOptions }

                this.questions.push(question);
            },
            addNewAnswer(newQuestionId){
                let answer = { questionId: newQuestionId, answer: '', gibberishLevel: ''}
                this.submittedAnswers.push(answer);
            },
            requestQuestionnaire(){
                this.loadingQuestionnaire = true;
                fetch(`${UrlManager()}/questionnaires`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
                }).then(response => {
                    return response.json()
                }).then(response => {
                    if (!response.errorCode){
                        this.submittedAnswers = []
                        this.questions = []
                        response.forEach(element => {
                            let resourceUrl = element.self.split('/');
                            resourceUrl = resourceUrl[resourceUrl.length-1];
                            this.addNewQuestion(resourceUrl, element.question, element.questionType, element.options)
                            this.addNewAnswer(resourceUrl)
                        });
                        /* submitterId: Schema.Types.ObjectId,
                        questionId: Schema.Types.ObjectId,
                        answer: String,
                        gibberishLevel: Schema.Types.Decimal128 */
                    }else
                        alert(ErrorCodes[response.errorCode])
                }).catch(() =>{
                    alert("Network error. Please try again later!")
                }).finally(() =>{
                    this.loadingQuestionnaire = false;
                });
            },
            submitQuestionnaire(){
                if (this.LOG_LEVEL >= 2)
                    for (let i = 0; i < this.submittedAnswers.length; i++){
                        console.log("Answer ",(i+1)," with question ID ",this.submittedAnswers[i].questionId," answer:")
                        console.log(this.submittedAnswers[i].answer)
                    }

                let validResponses = true;
                for (let i = 0; i < this.submittedAnswers.length && validResponses; i++)
                    if (this.submittedAnswers[i].answer == "")
                        validResponses = false;

                if (this.LOG_LEVEL >= 1) console.log("Valid responses: ",validResponses)

                if (validResponses){
                    this.submittedAnswers.forEach(element => {
                        if (this.getQuestionWith(element.questionId).questionType == QuestionType.OPEN_ENDED) 
                            element.gibberishLevel = 1 - isGibberish(element.answer, this.GIBBERISH_OPTIONS);
                        else
                            element.gibberishLevel = 0;
                    });

                    let maxGibberishLevel = 0;
                    for (let i = 0; i < this.submittedAnswers.length; i++){
                        let currentLevel = this.submittedAnswers[i].gibberishLevel;
                        if (this.LOG_LEVEL >= 2) console.log(currentLevel)
                        if (currentLevel > maxGibberishLevel)
                            maxGibberishLevel = this.submittedAnswers[i].gibberishLevel;
                    }
                    
                    if (maxGibberishLevel < this.MAXIMUM_ACCEPTED_GIBBERISH_LEVEL)
                    {
                        let duplicatedAnswers = false;
                        for (let i = 0; i < this.submittedAnswers.length && !duplicatedAnswers; i++){
                            this.submittedAnswers.forEach(element => {
                                if (element.gibberishLevel != 0 && element != this.submittedAnswers[i] &&
                                    element.gibberishLevel == this.submittedAnswers[i].gibberishLevel)
                                    duplicatedAnswers = true;
                            });
                        }

                        if (duplicatedAnswers)
                            alert("Please avoid submitting duplicated answers!")
                        else
                            this.sendAnswers(this.submittedAnswers);
                    }
                    else
                        alert("Your answers contain too much gibberish!")
                }
                else
                    alert("You didn't answer all the questions!")
            },
            sendAnswers(submittedAnswers){
                fetch(`${UrlManager()}/questionnaires`, {
                    method: "POST",
                    body: JSON.stringify({
                        answers: submittedAnswers
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                }).then(response => {
                    if (response.ok){
                        EventBus.emit('questionnaireSent')
                        alert("Questionnaire sent successfully!")
                    }
                    else
                        return response.json()
                }).then(response => {
                    if (response)
                        alert(ErrorCodes[response.errorCode])
                }).catch(() =>{
                    alert("Network error. Please try again later!")
                });
            },
            getQuestionWith(questionId){
                for (let i=0; i < this.questions.length; i++)
                    if (this.questions[i].questionId == questionId)
                        return this.questions[i];
            }
        }
    }
</script>