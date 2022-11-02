const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        cloudinaryId: {
            type: String,
            required: true,
        },
        logoUrl: {
            type: String,
            required: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
