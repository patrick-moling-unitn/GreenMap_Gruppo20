const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Question', new Schema({ 
    question: {type: String, unique: true},
    questionType: Schema.Types.Int32,
    options: {type: JSON, default: null}
}));