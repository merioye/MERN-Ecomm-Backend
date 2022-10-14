const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    bannerUrl: {
        type: String,
        required: true
    },
    cloudinaryId: {
        type: String, 
        required: true
    },
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    validity: {
        type: Date,
        required: true
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    minimumAmount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);