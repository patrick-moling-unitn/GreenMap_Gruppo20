const QuestionOption = require('../enums/questionOption.cjs')
const QuestionType = require('../enums/questionType.cjs')

//permette di aggiungere argomenti dinamicamente ad una stringa.
String.prototype.format = function() {
    let formatted = this;
    for (let i = 0; i < arguments.length; i++) {
        let regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

const tableLine = "{0}=========================================================================================={1}",
      tableHeader = " {0}"+'\n'+
      tableLine.format("-|","|-")+'\n';

class QuestionnaireUtility {
    getNotAnsweredQuestions(userAnswerList, questionList){
        return questionList.filter(question => {
            let answer = userAnswerList.find(answer => String(answer.questionId) == String(question._id));
            if (!answer) return question;
        })
    }
    getRandomQuestions(questionList, numberOfQuestions){
        if (questionList.length < numberOfQuestions) return null;
        if (questionList.length == numberOfQuestions) return questionList;
        let randomQuestionList = []
        for (let i=0; i < numberOfQuestions; i++){
            let index = Math.floor(Math.random() * questionList.length);
            randomQuestionList.push(questionList[index]);
            //probabilmente sarebbe più veloce fare un if prima ed evitare doppioni invece che togliere elementi da un array...
            questionList.splice(index, 1);
        }
        return randomQuestionList;
    }
    getQuestionsWithAnswerData(questionList, answerList){
        questionList = questionList.map(element => {
            let newOptions = element.options, newAnswers = [];
            switch (element.questionType) {
                case QuestionType.DICHOTOMOUS: newOptions = QuestionOption.DICHOTOMOUS; break;
                case QuestionType.RATING_SCALE: newOptions = QuestionOption.RATING_SCALE; break;
            }
            if (newOptions != null) newOptions.forEach(option => newAnswers.push(0))
            return {
                _id: element._id,
                question: element.question,
                questionType: element.questionType,
                options: newOptions,
                answers: newAnswers,
                openAnswers: [],
                answerCount: 0,
            }
        });
        answerList.forEach(answer => {
            let questionOfAnswer = questionList.find(question => String(question._id) == String(answer.questionId));
            if (questionOfAnswer.questionType != QuestionType.OPEN_ENDED){
                let optionIndex = questionOfAnswer.options.indexOf(answer.answer)
                questionOfAnswer.answers[optionIndex]++;
            }else
                questionOfAnswer.openAnswers.push(answer.answer)
            questionOfAnswer.answerCount++;
        })
        return questionList
    }
    formatQuestionsForMail(questionList){
        let mailText = "", questionNumber = 1;
        questionList.forEach(question => {
            mailText += "\n"
            mailText += tableHeader.format(questionNumber + ") " + question.question);

            mailText += " Total recieved answers: "+question.answerCount+"\n"
            mailText += tableLine.format("=","=")+"\n"
            if (question.questionType != QuestionType.OPEN_ENDED){
                let i = 0;
                question.answers.forEach(count => {
                    mailText += " "+question.options[i] +": " + count+"\n"
                    i++;
                });
            }else {
                question.openAnswers.forEach(answer => {
                    mailText += " "+answer+"\n"
                });
            }
            mailText += tableLine.format("-|","|-")+"\n"
            questionNumber++;
        })
        return mailText;
    }
}

const questionnaireUtility = new QuestionnaireUtility();

module.exports = questionnaireUtility;