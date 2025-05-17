const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Report', new Schema({ 
    issuerId: Schema.Types.ObjectId,
    reportType: Schema.Types.Int32,
    reportDescription: String,
    latitude: Schema.Types.Decimal128,
    longitude: Schema.Types.Decimal128,
    resolved: Boolean
}));