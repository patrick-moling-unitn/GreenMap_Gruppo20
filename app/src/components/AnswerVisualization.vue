<template>
  <div>
    <button type="button" class="btn btn-primary" @click="populateAnswersAndQuestions">Get all answers</button>
    <h2>Answers submitted by users</h2>

  </div>
  <div>
    <ol>
      <li v-for="question in questionAndAnswers">
            {{question.questionData}}
            <ul>
                <li v-for="answer in question.answers">
                    {{answer.answer}}
                    <button type="button" class="btn btn-primary" @click="banIssuer(answer.issuerId)">Ban the issuer of this answer.</button>
                </li>
            </ul>
      </li>
        
    </ol>
  </div>
</template>





<script default>

import UrlManager from '@/urlManager'
import TokenManager from '@/tokenManager'


export default {

    data() {
        return {
            questionAndAnswers: [],

            submittedAnswers: [
                { questionId: "1", answer: "answer1" , issuerId: 1 },
                { questionId: "2", answer: "answer2" , issuerId: 2 },
                { questionId: "2", answer: "answer3" , issuerId: 3 },
                { questionId: "3", answer: "answer4" , issuerId: 1 },
                { questionId: "3", answer: "answer5" , issuerId: 5 },
                { questionId: "3", answer: "answer6" , issuerId: 4 },
                { questionId: "4", answer: "" , issuerId: 6 },
                { questionId: "5", answer: "" , issuerId: 7 },
                { questionId: "6", answer: "" , issuerId: 8 },
                { questionId: "7", answer: "" , issuerId: 9 },
                { questionId: "8", answer: "" , issuerId: 11 }
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
    },


    methods : {

        getAllAnswersForQuestion(question) {
            console.log("Getting answers.")
            let url = question.self.split("/");
            let id = url[url.length-1];
            fetch(`${UrlManager()}/questionnaires/${id}`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => response.json())
            .then(response => {
                console.log(response);
                this.questionAndAnswers.push({questionData: question.question, answers: response});
            });
        },

        populateAnswersAndQuestions() {
            console.log("Getting questions.");
            fetch(`${UrlManager()}/questionnaires?type=question`, {
                method: "GET",
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    "x-access-token": TokenManager()
                }
            })
            .then(response => response.json())
            .then(response => {
                response.forEach((element) => {
                    this.getAllAnswersForQuestion(element);
                });
            });
        },


        banIssuer(issuerId) {
            console.log("Ban issued.")
            fetch(`${UrlManager()}/answerManager/${issuerId}`, {
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
        }
    }
}
</script>