<template>
    <h1>Manage Questions</h1>
    
    <div class="primary-color p-4 mt-4">
    <div v-for="(question, index) in questions" :key="index" :class="index == 0 ? '' : 'mt-4'">
        <h3>Question {{ (index+1) }}</h3>
        <textarea :id="question.questionId" class="form-control" v-model="questions[index].question" aria-label="With textarea"></textarea>
        
        <div class="input-group">
        <label class="input-group-text" for="inputGroupSelect">Question Type</label>
        <select v-model="question.questionType" class="form-select" id="inputGroupSelect">
            <option selected disabled value="">Choose a question type...</option>
            <option value="0">Open Ended</option>
            <option value="1">Close Ended</option>
            <option value="2">Rating Scale (1-10)</option>
            <option value="3">Dichotomous (True/False)</option>
        </select>
        </div>

        <div v-if="question.questionType==1" class="mt-2">
            <h5>Close Ended Options</h5>
            <div v-for="(option, optionIndex) in question.options" :key="optionIndex">
            <input type="text" v-model="questions[index].options[optionIndex]" class="form-control mt-1" placeholder="Option" aria-label="Option" aria-describedby="basic-option">
            </div>
        </div>

        <div class="d-flex mt-4">
            <button type="button" class="btn btn-primary">Update Question</button>
            <button type="button" class="btn btn-danger ms-2">Delete Question</button>
        </div>
    </div>
    </div>
</template>

<script default>
import UrlManager from '@/urlManager'
import TokenManager from '@/tokenManager'
import QuestionType from '@enum/questionType.esm';

    export default{
        data() {
            return {
                questions: [ { questionId: "testquestionid1", question: "If you could improve the city. What is the first thing you would do?", 
                               questionType: QuestionType.OPEN_ENDED, options: [ "Option A", "Option B" ] } 
                           ]
            }
        },
        mounted() {
            this.getAllQuestions();
            console.log(QuestionType.OPEN_ENDED)
        },
        methods: {
            getAllQuestions(){
                
            }
        }
    }
</script>