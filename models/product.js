const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        category: {
            type: String,
            required: true,
        },
        images: {
            type: Array,
            required: true,
            default: [],
        },
        desc: {
            type: String,
            required: true,
        },
        stock: {
            type: Number,
            required: true,
        },
        brand: {
            type: String,
            required: true,
        },
        regularPrice: {
            type: Number,
            required: true,
        },
        salePrice: {
            type: Number,
            required: true,
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isOnSale: {
            type: Boolean,
            default: false,
        },
        reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
