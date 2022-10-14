const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    cloudinaryId: {
        type: String,
        required: true
    },
    logoUrl: {
        type: String,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


module.exports = mongoose.model('Category', categorySchema);