const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('AuthenticatedUser', new Schema({ 
    id: {type: String, required: true, unique: true},
    username: {type: String, lowercase: true},
    email: {type: String, lowercase: true, unique: true},
    passwordHash: {type: String, minLength: 8},
    authenicated: Boolean,
    administrator: Boolean,
    points: mongoose.Schema.Types.Int32
}));