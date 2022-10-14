const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    products: [
        {
            quantity: {
                type: Number,
                required: true
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            }
        }
    ],
    couponCode: {
        type: String,
        default: ''
    },
    couponDiscountPercentage: {
        type: Number,
        default: 0
    },
    couponMinimumAmount: {
        type: Number,
        default: 0
    }
});


module.exports = mongoose.model('Cart', cartSchema);