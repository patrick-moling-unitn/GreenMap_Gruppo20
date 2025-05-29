<template>
    <div class="primary-color row align-items-center" v-if="answerPercentage != 0">
        <h6 :class="'col-'+String(12-col_size)+' m-0'">{{ option }}</h6>
        <div :class="'progress'+' col-'+String(col_size)" role="progressbar" aria-label="answerSlider" :aria-valuenow="answerPercentage" aria-valuemin="0" aria-valuemax="100">
        <div :class="option == dichotomousQuestionOptions[1] ? 'progress-bar text-bg-danger' : 'progress-bar text-bg-success'" :style="'width: '+answerPercentage+'%'"> {{ answerPercentage }}%</div>
        </div>
    </div>
</template>

<script>
import QuestionOption from '@enum/questionOption.esm';

    export default {
        data() {
            return {
                dichotomousQuestionOptions: QuestionOption.DICHOTOMOUS,
            }
        },
        props: {
            questionType: "",
            option: "",
            answerPercentage: "",
            col_size: ""
        }
    }
</script>