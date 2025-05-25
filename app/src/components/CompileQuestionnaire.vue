<template>
    <div class="questionnaire-body">
    <h1>Compile Questionnaire</h1>
    
    <div class="primary-color p-4 mt-4">
    <div v-for="(question, index) in simulatedQuestions" :key="index" :class="index == 0 ? '' : 'mt-4'">
        <div id="openEndedQuestion" v-if="question.type=='open'">
            <p>{{ question.question }}</p>

            <div class="input-group">
            <textarea class="form-control" v-model="submittedAnswers[index].answer" aria-label="With textarea"></textarea>
            </div>
        </div>
        <div id="ratingScaleQuestion" v-else-if="question.type=='rating'">
            <p>{{ question.question }}</p>
            <div>
                <div class="form-check form-check-inline" v-for="option in ratingQuestionOptions">
                <input :id="'inlineRadio'+option" v-model="submittedAnswers[index].answer" class="form-check-input" type="radio" :name="'radio'+question.questionId" :value="option">
                <label class="form-check-label" :for="'inlineRadio'+option">{{ option }}</label>
                </div>
            </div>
        </div>
        <div id="dichotomousQuestion" v-else-if="question.type=='dichotomous'">
            <p>{{ question.question }}</p>
            <div class="form-check" v-for="option in dichotomousQuestionOptions">
            <input class="form-check-input" v-model="submittedAnswers[index].answer" type="radio" :name="'radio'+question.questionId" :id="'radioDefault'+question.questionId" :value="option">
            <label class="form-check-label" :for="'radioDefault'+option">
                {{ option }}
            </label>
            </div>
        </div>
        <div id="closeEndedQuestion" v-else-if="question.type=='closed'">
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
</template>

<style>
@media (min-width: 1024px) {
  .questionnaire-body {
    margin-right: 20%;
  }
}
@media (max-width: 1024px) {
  .questionnaire-body {
    margin-left: 5%;
    margin-right: 5%;
  }
}
</style>

<script>
import isGibberish from 'is-gibberish';
import UrlManager from '@/urlManager'
import TokenManager from '@/tokenManager'
import EventBus from '@/EventBus'

    export default {
        mounted(){
            // DELETE ALL QUESTIONNAIRES CODE
            /*    fetch(`${UrlManager()}/questionnaires`, {
                    method: "DELETE",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                        "x-access-token": TokenManager()
                    }
                })
            */
        },
        data() {
            return {
                MAXIMUM_ACCEPTED_GIBBERISH_LEVEL: .8,
                GIBBERISH_OPTIONS: { returnScore: true, sensitivity: 0.111 },
                LOG_LEVEL: 1, //0: NONE, 1: MIN, 2: MID, 3: HIGH
                dichotomousQuestionOptions: ["Yes", "No"],
                ratingQuestionOptions: [1,2,3,4,5,6,7,8,9,10],
                submittedAnswers: [ 
                    { questionId: "testquestionid1", answer: "", gibberishLevel: ""},
                    { questionId: "testquestionid2", answer: "", gibberishLevel: ""},
                    { questionId: "testquestionid3", answer: "", gibberishLevel: ""},
                    { questionId: "testquestionid4", answer: "", gibberishLevel: ""},
                    { questionId: "testquestionid5", answer: "", gibberishLevel: ""},
                    { questionId: "testquestionid6", answer: "", gibberishLevel: ""},
                    { questionId: "testquestionid7", answer: "", gibberishLevel: ""},
                    { questionId: "testquestionid8", answer: "", gibberishLevel: ""},
                ],
                simulatedQuestions: [ 
                    { questionId: "testquestionid1", question: "If you could improve the city. What is the first thing you would do?", type: "open" }, // What a lovely day to...
                    { questionId: "testquestionid2", question: "What is the most valuable thing a city should have in your opinion?", type: "open"}, // What a lovely day to...
                    { questionId: "testquestionid3", question: "How often happens that you need a trashcan type that is too far?", type: "rating"}, // 1 to 10
                    { questionId: "testquestionid4", question: "Rate the current city's level of cleanliness", type: "rating"}, // 1 to 10
                    { questionId: "testquestionid5", question: "Did you throw trash on the ground because there where no trashcans nearby?", type: "dichotomous"}, // TRUE/FALSE
                    { questionId: "testquestionid6", question: "Do you usually do recycling collection?", type: "dichotomous"}, // TRUE/FALSE
                    { questionId: "testquestionid7", question: "What trashcan type do you need more?", type: "closed", // A/B/C 
                        options: ["Paper", "Plastic", "Residue", "Glass", "Organic"]},
                    { questionId: "testquestionid8", question: "Which of the following is a key area of improvement you think the city should focus on?", type: "closed",  // A/B/C
                        options: ["Garbage collection", "City's security", "Trashcan placement", "Trashcan maintenance"]},
                ]
            }
        },
        methods: {
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
                        if (this.getQuestionWith(element.questionId).type == "open") 
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
                submittedAnswers.forEach(element => {
                    element.questionId = null; // PER IL MOMENTO NON ESISTE NESSUNA QUESTION ID!!!
                });
                console.warn("Deleted all questions ID! CompileQuestionnaire.vue; Line 167");
                fetch(`${UrlManager()}/questionnaires?type=questionnaire`, {
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
                        alert(response.message)
                });
            },
            getQuestionWith(questionId){
                for (let i=0; i < this.simulatedQuestions.length; i++)
                    if (this.simulatedQuestions[i].questionId == questionId)
                        return this.simulatedQuestions[i];
            }
        }
    }
</script>