const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('AuthenticatedUser', new Schema({ 
    passwordHash: String,
    email: {type: String, lowercase: true, unique: true},
    banned: Boolean, //Non ci serve sapere se è autenticato visto che possiede un authToken
    administrator: Boolean,
    points: Schema.Types.Int32,
    lastReportIssueDate: Date,
    isSystem: {type: Boolean, default: false}
}));