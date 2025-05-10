const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('AuthenticatedUser', new Schema({ 
    passwordHash: {type: String, minLength: 8},
    email: {type: String, lowercase: true, unique: true},
    authenticated: Boolean,
    administrator: Boolean,
    points: mongoose.Schema.Types.Int32
}));