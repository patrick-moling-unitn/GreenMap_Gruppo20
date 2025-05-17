const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('RegisteringUser', new Schema({ 
    passwordHash: String,
    email: {type: String, lowercase: true, unique: true},
    verificationCode: {
        code: mongoose.Schema.Types.Int32,
        expireDate: Date
    }
}, {timestamps: true}));