const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Discount', new Schema({ 
    redeemedBy: {type: Schema.Types.ObjectId, default: null},
    discountType: Schema.Types.Int32,
    amount: Schema.Types.Decimal128,
    code: String
}));