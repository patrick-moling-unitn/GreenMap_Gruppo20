<template>
    <h1>Compile Questionnaire</h1>
    
    <div class="primary-color p-4">
    <div v-for="question in simulatedQuestions" :class="question == simulatedQuestions[0] ? '' : 'mt-4'">
        <div id="openEndedQuestion" v-if="question.type=='open'">
            <p>{{ question.question }}</p>

            <div class="input-group">
            <textarea class="form-control" aria-label="With textarea"></textarea>
            </div>
        </div>
        <div id="ratingScaleQuestion" v-else-if="question.type=='rating'">
            <p>{{ question.question }}</p>
            <div>
                <div class="form-check form-check-inline" v-for="option in ratingQuestionOptions">
                <input :id="'inlineRadio'+option" class="form-check-input" type="radio" :name="'radio'+question.questionId" value="option">
                <label class="form-check-label" :for="'inlineRadio'+option">{{ option }}</label>
                </div>
            </div>
        </div>
        <div id="dichotomousQuestion" v-else-if="question.type=='dichotomous'">
            <p>{{ question.question }}</p>
            <div class="form-check" v-for="option in dichotomousQuestionOptions">
            <input class="form-check-input" type="radio" :name="'radio'+question.questionId" :id="'radioDefault'+question.questionId">
            <label class="form-check-label" :for="'radioDefault'+option">
                {{ option }}
            </label>
            </div>
        </div>
        <div id="closeEndedQuestion" v-else-if="question.type=='closed'">
            <p>{{ question.question }}</p>
            <div class="form-check" v-for="option in question.options">
            <input class="form-check-input" type="radio" :name="'radio'+question.questionId" :id="'radio'+question.questionId">
            <label class="form-check-label" for="radioDefault1">
                {{ option }}
            </label>
            </div>
        </div>
    </div>
    </div>
    <button type="button" class="btn btn-outline-primary m-4 align-self-start">Submit Questionnaire</button>
</template>

<script>
    export default {
        data() {
            return {
                dichotomousQuestionOptions: ["Yes", "No"],
                ratingQuestionOptions: [1,2,3,4,5,6,7,8,9,10],
                submittedAnswers: [ 
                    { questionId: "1", answer: ""},
                    { questionId: "2", answer: ""},
                    { questionId: "3", answer: ""},
                    { questionId: "4", answer: ""},
                    { questionId: "5", answer: ""},
                    { questionId: "6", answer: ""},
                    { questionId: "7", answer: ""},
                    { questionId: "8", answer: ""},
                ],
                simulatedQuestions: [ 
                    { questionId: "1", question: "If you could improve the city. What is the first thing you would do?", type: "open" }, // What a lovely day to...
                    { questionId: "2", question: "What is the most valuable thing a city should have in your opinion?", type: "open"}, // What a lovely day to...
                    { questionId: "3", question: "How often happens that you need a trashcan type that is too far?", type: "rating"}, // 1 to 10
                    { questionId: "4", question: "Rate the current city's level of cleanliness", type: "rating"}, // 1 to 10
                    { questionId: "5", question: "Did you throw trash on the ground because there where no trashcans nearby?", type: "dichotomous"}, // TRUE/FALSE
                    { questionId: "6", question: "Do you usually do recycling collection?", type: "dichotomous"}, // TRUE/FALSE
                    { questionId: "7", question: "What trashcan type do you need more?", type: "closed", // A/B/C 
                        options: ["Paper", "Plastic", "Residue", "Glass", "Organic"]},
                    { questionId: "8", question: "Which of the following is a key area of improvement you think the city should focus on?", type: "closed",  // A/B/C
                        options: ["Garbage collection", "City's security", "Trashcan placement", "Trashcan maintenance"]},
                ]
            }
        }
    }
</script>