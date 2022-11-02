const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    refreshToken: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
