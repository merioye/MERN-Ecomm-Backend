const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            required: true,
        },
        reviewAuthor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
