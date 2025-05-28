const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// set up a mongoose model
module.exports = mongoose.model('Discount', new Schema({ 
    redeemedBy: {type: Schema.Types.ObjectId, default: null},
    discountType: Schema.Types.Int32,
    isPercentage: Boolean,
    amount: {
        type: Schema.Types.Decimal128,
        min: [0.01, 'Amount must be greater than 0'],
        validate: {
            validator: (value)=>{
                if (this.isPercentage) 
                    return parseFloat(value) <= 100;
                return true;
            },
            message: 'Percentage discount cannot exceed 100'
        }
    },
    code: {type: String, unique: true}
}));