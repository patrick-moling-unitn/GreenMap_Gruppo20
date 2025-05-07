const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Trashcan', new Schema({ 
    latitude: mongoose.Schema.Types.Decimal128,
    longitude: mongoose.Schema.Types.Decimal128,
    trashcanType: mongoose.Schema.Types.Int32
}));