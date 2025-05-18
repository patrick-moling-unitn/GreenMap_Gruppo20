const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Trashcan', new Schema({ 
    latitude: Schema.Types.Decimal128,
    longitude: Schema.Types.Decimal128,
    trashcanType: Schema.Types.Int32
}));