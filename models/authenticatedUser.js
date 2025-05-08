const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('AuthenticatedUser', new Schema({ 
    passwordHash: String,
    email: String,
    authenticated: Boolean,
    administrator: Boolean,
    points: mongoose.Schema.Types.Int32
}));