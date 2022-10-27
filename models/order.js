const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        paymentMethod: {
            type: String,
            required: true,
            enum: ["card", "cash"],
        },
        paymentReceived: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["pending", "processing", "delivered", "cancelled"],
            default: "pending",
        },
        items: {
            type: Array,
            required: true,
        },
        discountAmount: {
            type: Number,
            default: 0,
        },
        amountToCharge: {
            type: Number,
            requried: true,
        },
        note: {
            type: String,
            default: "",
        },
        notificationViewed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
