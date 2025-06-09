<template>
  <div class="adaptive-margin-body">
  <h1>Answer Visualization</h1>
    
  <div v-if="questionAndAnswers.length > 0">
    <div class="secondary-color p-4 mt-4">
      <div v-for="(questionData, questionIndex) in questionAndAnswers" :key="questionIndex" :class="questionIndex == 0 ? '' : 'mt-4'">
            <h5>{{questionData.question}}</h5>

            <div class="tertiary-color p-4 mt-4" v-if="questionData.questionType==0"> <!-- OPEN_ENDED -->
                <div class="secondary-color mb-4 p-2 form-check form-switch">
                <input class="form-check-input ms-1" v-model="showAnswersWithPossibleGibberish" type="checkbox" role="switch" id="switchCheck">
                <label class="form-check-label ms-2" for="switchCheck">Show answers marked as possible gibberish</label>
                </div>
                <h6 v-if="questionData.openAnswers == 0">No answers recieved for this question</h6>
                <div v-else v-for="answerData in questionData.openAnswers" class="mt-2">
                    <div v-if="answerData.gibberishLevel.$numberDecimal < GIBBERISH_WARNING_THREESHOLD || showAnswersWithPossibleGibberish">
                    <div class="alert alert-warning d-flex align-items-center m-0" role="alert" style="height: 25px" v-if="answerData.gibberishLevel.$numberDecimal > GIBBERISH_WARNING_THREESHOLD">
                    <svg xmlns="http://www.w3.org/2000/svg" class="bi flex-shrink-0 me-2 alert-icon" viewBox="0 0 16 16" role="img" aria-label="Warning:">
                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <div>
                        This answer could contain gibberish [{{ (answerData.gibberishLevel.$numberDecimal * 100).toFixed(0) }}%]
                    </div>
                    </div>
                    <div class="primary-color row align-items-center">
                        <h6 class="col m-0">{{answerData.answer}}</h6>
                        <button type="button" class="btn btn-danger col-3" @click="banIssuerWrapper(answerData.issuerId)">Ban the issuer of this answer.</button>
                    </div>
                    </div>
                </div>
            </div>
            <div class="tertiary-color p-4 mt-4" v-else-if="questionData.questionType==1"> <!-- CLOSE_ENDED -->
                <h6 v-if="questionData.answerCount == 0">No answers recieved for this question</h6>
                <div v-else>
                    <h6 class="fw-bold text-end">Recieved answers: {{ questionData.answerCount }}</h6>
                    <div v-for="(currentOption, index) in questionData.options" :key="index" :class="index == 0 ? '' : 'mt-2'">
                    <AnswerStatistics :option="currentOption" :answerPercentage="getPercentageOf(index, questionData)" :col_size="9"></AnswerStatistics>
                    </div>
                </div>
            </div>
            <div class="tertiary-color p-4 mt-4" v-else-if="questionData.questionType==2"> <!-- RATING_SCALE -->
                <h6 v-if="questionData.answerCount == 0">No answers recieved for this question</h6>
                
                <div v-else>
                    <h6 class="fw-bold text-end">Recieved answers: {{ questionData.answerCount }}</h6>
                    <div v-for="(currentOption, index) in ratingQuestionOptions" :key="index" :class="index == 0 ? '' : 'mt-2'">
                    <AnswerStatistics :option="currentOption" :answerPercentage="getPercentageOf(index, questionData)" :col_size="11"></AnswerStatistics>
                    </div>
                </div>
            </div>
            <div class="tertiary-color p-4 mt-4"  v-else-if="questionData.questionType==3"> <!-- DICHOTOMOUS -->
                <h6 v-if="questionData.answerCount == 0">No answers recieved for this question</h6>
                <div v-else>
                    <h6 class="fw-bold text-end">Recieved answers: {{ questionData.answerCount }}</h6>
                    <div v-for="(currentOption, index) in dichotomousQuestionOptions" :key="index" :class="index == 0 ? '' : 'mt-2'">
                    <AnswerStatistics :option="currentOption" :answerPercentage="getPercentageOf(index, questionData)" :col_size="9"></AnswerStatistics>
                    </div>
                </div>
            </div>
      </div>
    </div>
  </div>
  <h5 v-else class="mt-4 mb-4">No answers submitted at the moment</h5>
  <div class="d-flex secondary-color p-4 mt-4">
        <LoadingSpinner v-if="loadingQuestions"></LoadingSpinner>
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
import usersFunctions from '@/usersFunctions'
import AnswerStatistics from './AnswerStatistics.vue';
import QuestionOption from '@enum/questionOption.esm';
import LoadingSpinner from './LoadingSpinner.vue';

export default {
    components : {
        AnswerStatistics,
        LoadingSpinner
    },
    data() {
        return {
            showAnswersWithPossibleGibberish: true,
            GIBBERISH_WARNING_THREESHOLD: .6,
            NUMBER_OF_STATISTICS_DECIMALS: 1,
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
            let percentage = (optionCount / totalCount * 100)
            return percentage == Math.floor(percentage) ? percentage : percentage.toFixed(this.NUMBER_OF_STATISTICS_DECIMALS)
        },

        populateAnswersAndQuestions() {
            console.log("Getting questions.");
            this.loadingQuestions = true;

            fetch(`${UrlManager()}/questionnaires/answers?method=browser`, {
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
            }).catch(() =>{
              alert("Network error. Please try again later!")
            }).finally(() =>{
                this.loadingQuestions = false;
            });
        },
        async banIssuerWrapper(userID){
            const {banUnbanUser} = usersFunctions();
            await banUnbanUser(userID)
            this.getAllAnswers();
        },
        getAnswersViaEmail() {
            this.loadingQuestions = true;
            fetch(`${UrlManager()}/questionnaires/answers?method=email`, {
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
            }).catch(() =>{
              alert("Network error. Please try again later!")
            }).finally(() => {
                this.loadingQuestions = false;
            });
        }
    }
}
</script>