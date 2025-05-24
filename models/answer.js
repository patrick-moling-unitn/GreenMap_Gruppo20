const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Answer', new Schema({ 
    submitterId: Schema.Types.ObjectId,
    questionId: Schema.Types.ObjectId,
    answer: String,
    gibberishLevel: Schema.Types.Decimal128
}));