const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    isOnlyEmoji: {
        type: Boolean,
        required: false,
        default: false,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
});

module.exports = mongoose.model("Message", messageSchema);
