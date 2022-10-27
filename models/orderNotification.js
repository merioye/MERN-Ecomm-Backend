const mongoose = require("mongoose");

const orderNotificationSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("OrderNotification", orderNotificationSchema);
