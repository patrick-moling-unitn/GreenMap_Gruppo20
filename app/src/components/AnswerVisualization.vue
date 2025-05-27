<template>
  <div class="adaptive-margin-body">
  <h1>Answer Visualization</h1>
    
  <div v-if="questionAndAnswers.length > 0">
    <div class="secondary-color p-4 mt-4">
      <div v-for="(questionData, index) in questionAndAnswers" :key="index" :class="index == 0 ? '' : 'mt-4'">
            <h5>{{questionData.question}}</h5>

            <div class="tertiary-color p-4 mt-4" v-if="questionData.question.questionType==0"> <!-- OPEN_ENDED -->
                <div class="secondary-color mb-4 p-2 form-check form-switch">
                <input class="form-check-input ms-1" v-model="showAnswersWithPossibleGibberish" type="checkbox" role="switch" id="switchCheck">
                <label class="form-check-label ms-2" for="switchCheck">Show answers marked as possible gibberish</label>
                </div>
                <div v-for="answerData in questionData.openAnswers" class="mt-2">
                    <div v-if="answerData.gibberishLevel.$numberDecimal < GIBBERISH_WARNING_THREESHOLD || showAnswersWithPossibleGibberish">
                    <div class="alert alert-warning d-flex align-items-center m-0" role="alert" style="height: 25px" v-if="answer.gibberishLevel.$numberDecimal > GIBBERISH_WARNING_THREESHOLD">
                    <svg xmlns="http://www.w3.org/2000/svg" class="bi flex-shrink-0 me-2 alert-icon" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <div>
                        This answer could contain gibberish [{{ answerData.gibberishLevel.$numberDecimal * 100 }}%]
                    </div>
                    </div>
                    <div class="primary-color row align-items-center">
                        <h6 class="col m-0">{{answerData.answer}}</h6>
                        <button v-if="questionData.question.questionType==0" type="button" class="btn btn-danger col-3" @click="banIssuer(answer.issuerId)">Ban the issuer of this answer.</button>
                    </div>
                    </div>
                </div>
            </div>
            <div class="tertiary-color p-4 mt-4" v-else-if="questionData.questionType==1"> <!-- CLOSE_ENDED -->
                <div v-for="(option, index) in questionData.options" :key="index" :class="index == 0 ? '' : 'mt-2'">
                    <div class="primary-color row align-items-center" v-if="getPercentageOf(index, questionData) != 0">
                        <h6 class="col-3 m-0">{{ option }}</h6>
                        <div class="progress col-9" role="progressbar" aria-label="answerSlider" :aria-valuenow="getPercentageOf(index, questionData)" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar text-bg-success" :style="'width: '+getPercentageOf(index, questionData)+'%'"> {{ getPercentageOf(index, questionData) }}%</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tertiary-color p-4 mt-4" v-else-if="questionData.questionType==2"> <!-- RATING_SCALE -->
                <div v-for="(option, index) in ratingQuestionOptions" :key="index" :class="index == 0 ? '' : 'mt-2'">
                    <div class="primary-color row align-items-center" v-if="getPercentageOf(index, questionData) != 0">
                        <h6 class="col-1 m-0">{{ option }}</h6>
                        <div class="progress col-11" role="progressbar" aria-label="answerSlider" :aria-valuenow="getPercentageOf(index, questionData)" aria-valuemin="0" aria-valuemax="100">
                        <div class="progress-bar text-bg-success" :style="'width: '+getPercentageOf(index, questionData)+'%'"> {{ getPercentageOf(index, questionData) }}%</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="tertiary-color p-4 mt-4"  v-else-if="questionData.questionType==3"> <!-- DICHOTOMOUS -->
                <div v-for="(option, index) in dichotomousQuestionOptions" :key="index" :class="index == 0 ? '' : 'mt-2'">
                    <div class="primary-color row align-items-center" v-if="getPercentageOf(index, questionData) != 0">
                        <h6 class="col-1 m-0">{{ option }}</h6>
                        <div class="progress col-11" role="progressbar" aria-label="answerSlider" :aria-valuenow="getPercentageOf(index, questionData)" aria-valuemin="0" aria-valuemax="100">
                        <div :class="option == dichotomousQuestionOptions[0] ? 'progress-bar text-bg-success' : 'progress-bar text-bg-danger'" :style="'width: '+getPercentageOf(index, questionData)+'%'"> {{ getPercentageOf(index, questionData) }}%</div>
                        </div>
                    </div>
                </div>
            </div>
      </div>
    </div>
  </div>
  <h5 v-else class="mt-4 mb-4">No answers submitted at the moment</h5>
  <div class="d-flex secondary-color p-4 mt-4">
        <div v-if="loadingQuestions" class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div v-else>
        <button type="button" class="btn btn-warning" @click="getAnswersViaEmail()">Get Answers Via Email</button>
        <button type="button" class="btn btn-primary ms-2" @click="populateAnswersAndQuestions()">Get All Answers</button>
        </div>
    </div>
  </div>
</template>

<script default>

import UrlManager from '@/urlManager'
import TokenManager from '@/tokenManager'
import QuestionType from '@enum/questionType.esm';
import QuestionOption from '@enum/questionOption.esm';


export default {

    data() {
        return {
            showAnswersWithPossibleGibberish: true,
            GIBBERISH_WARNING_THREESHOLD: .6,
            questionAndAnswers: [],
            loadingQuestions: false,
            dichotomousQuestionOptions: QuestionOption.DICHOTOMOUS,
            ratingQuestionOptions: QuestionOption.RATING_SCALE,
        }
    },

    mounted() {
        this.populateAnswersAndQuestions();
    },

    methods : {
        getPercentageOf(optionIndex, question){
            let optionCount = question.answers[optionIndex],
                totalCount = question.answerCount;
            return (optionCount / totalCount * 100).toFixed(0)
        },

        populateAnswersAndQuestions() {
            console.log("Getting questions.");
            this.loadingQuestions = true;

            fetch(`${UrlManager()}/questionnaires?type=answer&method=browser`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => response.json())
            .then(response => {
                this.questionAndAnswers = []
                response.forEach(question => {
                    this.questionAndAnswers.push(question);
                })
            }).finally(() =>{
                this.loadingQuestions = false;
            });
        },


        banIssuer(issuerId) {
            console.log("Ban issued.")
            fetch(`${UrlManager()}/questionnaires/${deletionQuestion.questionId}?type=userAnswers`, {
                method: "DELETE",
                body: JSON.stringify({
                    issuerId: issuerId
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => {
              if (!response.ok) {
                console.log("Errore nella risposta:", response);
                return;
              }

              console.log("Successo.");
              getAllAnswers();
              return response.json();
            });
        },

        getAnswersViaEmail() {
            this.loadingQuestions = true;
            fetch(`${UrlManager()}/questionnaires?type=answer&method=email`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => {
                //console.log(response);
                if (response.ok)
                    alert("Answers sent at your personal email!")
                else
                    alert("An error occurred while trying to send the answers!")
            }).finally(() => {
                this.loadingQuestions = false;
            });
        }
    }
}
</script>