<template>
    <div class="adaptive-margin-body">
    <h1>Manage Questions</h1>
    
    <div class="secondary-color p-4 mt-4" v-for="(question, index) in questions" :key="index">
        <h3>Question {{ (index+1) }}</h3>
        <textarea class="form-control" v-model="questions[index].question" aria-label="With textarea"></textarea>
        
        <div class="input-group mt-1">
        <label class="input-group-text" for="inputGroupSelect">Question Type</label>
        <select v-model="question.questionType" class="form-select" id="inputGroupSelect">
            <option selected disabled value="">Choose a question type...</option>
            <option value="0">Open Ended</option>
            <option value="1">Close Ended</option>
            <option value="2">Rating Scale ({{ratingOptions[0]+"-"+ratingOptions[ratingOptions.length-1]}})</option>
            <option value="3">Dichotomous ({{dichotomousOptions[0]+"/"+dichotomousOptions[1]}})</option>
        </select>
        </div>

        <div v-if="question.questionType==1" class="tertiary-color p-4 mt-4">
            <h5>Close Ended Options</h5>
            <div class="d-flex mt-1" v-for="(option, optionIndex) in question.options" :key="optionIndex">
            <input type="text" v-model="questions[index].options[optionIndex]" class="form-control" placeholder="Option" aria-label="Option" aria-describedby="basic-option">
            <button type="button" class="btn btn-danger m-1 text-nowrap" @click="removeOptionFromQuestion(index, optionIndex)">Remove Option</button>
            </div>
            <button type="button" class="btn btn-success mt-1" @click="addOptionToQuestion(index)">Add New Option</button>
        </div>

        <div v-if="question.loading" class="spinner-border  mt-4 mb-4" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div v-else class="d-flex mt-4 mb-4">
            <button v-if="question.questionId==null" type="button" class="btn btn-primary" @click="updateSelectedQuestion(index)">Submit New Question</button>
            <button v-else-if="hasAnswerChanged(index)" type="button" class="btn btn-success" @click="updateSelectedQuestion(index)">Update Question</button>
            <button type="button" class="btn btn-danger ms-2" @click="deleteSelectedQuestion(index)">Delete Question</button>
        </div>
    </div>
    <div class="d-flex secondary-color p-4 mt-4">
        <div v-if="loadingQuestions" class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        <div v-else>
        <button type="button" class="btn btn-success" @click="addNewQuestion()">Add New Question</button>
        <button type="button" class="btn btn-primary ms-2" @click="getAllQuestions()">Get All Questions</button>
        </div>
    </div>
    </div>
</template>

<script default>
import UrlManager from '@/urlManager'
import TokenManager from '@/tokenManager'
import QuestionType from '@enum/questionType.esm';
import QuestionOption from '@enum/questionOption.esm';

    export default{
        data() {
            return {
                dichotomousOptions: QuestionOption.DICHOTOMOUS,
                ratingOptions: QuestionOption.RATING_SCALE,
                DEFAULT_NEW_OPTION_TEXT: "New Option",
                DEFAULT_NEW_QUESTION_TEXT: "New Question",
                questions: [],
                loadingQuestions: false
            }
        },
        mounted() {
            this.getAllQuestions();
        },
        methods: {
            getOptionArrayToString(options){
                let stringed=""
                if (options != null)
                    options.forEach(element => {
                        stringed += String(element)
                    });
                return stringed;
            },
            getQuestionStructure(question){
                return question.question+""+question.questionType+""+
                    this.getOptionArrayToString(question.options);
            },
            hasAnswerChanged(questionId){
                let question = this.questions[questionId],
                    structure = this.getQuestionStructure(question);

                return question.original != structure;
            },
            addNewQuestion(){
                let question = { questionId: null, question: this.DEFAULT_NEW_QUESTION_TEXT, 
                    questionType: "", options: [ this.DEFAULT_NEW_OPTION_TEXT ], loading: false}
                this.questions.push(question);
            },
            addNewQuestion(newQuestionId, newQuestion, newQuestionType, newOptions){
                if (newOptions == null) newOptions = [ this.DEFAULT_NEW_OPTION_TEXT ]

                let question = { questionId: newQuestionId, question: newQuestion, 
                    questionType: newQuestionType, options: newOptions, original: null, loading: false}
                question.original = this.getQuestionStructure(question);

                this.questions.push(question);
            },
            updateSelectedQuestion(questionIndex){
                let questionValid = true,
                    question = this.questions[questionIndex];

                if (String(question.questionType) !== "")
                {
                    if (question.questionType == QuestionType.CLOSE_ENDED){
                        if (question.options.length == 0)
                            questionValid = false;
                        else{
                            question.options.forEach(element => {
                                if (element == this.DEFAULT_NEW_OPTION_TEXT || element == "")
                                    questionValid = false;
                            });
                        }
                    }

                    if (questionValid) 
                    {
                        if (question.question != this.DEFAULT_NEW_QUESTION_TEXT && question.question != "")
                        {
                            if (question.questionId == null) this.sendNewQuestion(question);
                            else this.updateQuestion(question);
                        }else
                            alert("The question you submitted is not valid! Please avoid leaving default or empty questions.");
                    }else
                        alert("The options choosen for this question are not valid! Please avoid leaving default or empty options.");
                }else
                    alert("Please choose a valid question type before submitting it!");
            },
            removeOptionFromQuestion(questionIndex, optionIndex){
                this.questions[questionIndex].options.splice(optionIndex, 1);
            },
            addOptionToQuestion(questionIndex){
                this.questions[questionIndex].options.push(this.DEFAULT_NEW_OPTION_TEXT);
            },
            deleteSelectedQuestion(questionIndex){
                let deletionQuestion = this.questions[questionIndex];
                
                if (deletionQuestion.questionId != null)
                    this.deleteQuestion(deletionQuestion, questionIndex);
                else
                    this.questions.splice(questionIndex, 1);
            },
            deleteQuestion(deletionQuestion, questionIndex){
                deletionQuestion.loading = true;
                fetch(`${UrlManager()}/questionnaires/${deletionQuestion.questionId}?type=question`, {
                    method: "DELETE",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                }).then(response => {
                    if (response.ok)
                        this.questions.splice(questionIndex, 1);
                    else
                        return response.json()
                }).then(response => {
                    if (response)
                        alert(response.message)
                }).finally(() => {
                    deletionQuestion.loading = false;
                });
            },
            sendNewQuestion(newQuestion){
                newQuestion.loading = true;
                fetch(`${UrlManager()}/questionnaires?type=question`, {
                    method: "POST",
                    body: JSON.stringify({
                        question: {
                            question: newQuestion.question, 
                            questionType: newQuestion.questionType, 
                            options: newQuestion.options
                        }
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                }).then(response => {
                    return response.json()
                }).then(response => {
                    if (!response.error){
                        newQuestion.questionId = response.id;
                        newQuestion.original = this.getQuestionStructure(newQuestion);
                        //alert("Question submitted successfully!")
                    }
                    else
                        alert(response.message)
                }).finally(() => {
                    newQuestion.loading = false;
                });
            },
            updateQuestion(updatingQuestion){
                updatingQuestion.loading = true;
                fetch(`${UrlManager()}/questionnaires/${updatingQuestion.questionId}?type=question`, {
                    method: "PUT",
                    body: JSON.stringify({
                        question: {
                            question: updatingQuestion.question, 
                            questionType: updatingQuestion.questionType, 
                            options: updatingQuestion.options
                        }
                    }),
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                }).then(response => {
                    if (response.ok){
                        updatingQuestion.original = this.getQuestionStructure(updatingQuestion)
                        //alert("Question updated successfully!")
                    }
                    else
                        return response.json()
                }).then(response => {
                    if (response)
                        alert(response.message)
                }).finally(() => {
                    updatingQuestion.loading = false;
                });
            },
            getAllQuestions(){
                this.loadingQuestions = true;
                fetch(`${UrlManager()}/questionnaires?type=question`, {
                    method: "GET",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                }).then(response => {
                    return response.json()
                }).then(response => {
                    if (!response.error){
                        let newQuestions = response;
                        this.questions = [];
                        newQuestions.forEach(element => {
                            let resourceUrl = element.self.split('/');
                            resourceUrl = resourceUrl[resourceUrl.length-1];
                            this.addNewQuestion(resourceUrl, element.question, element.questionType, element.options);
                        });
                    }else
                        alert(response.message)
                }).finally(() => {
                    this.loadingQuestions = false;
                })
            }
        }
    }
</script>