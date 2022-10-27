const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        method: {
            type: String,
            enum: ["custom", "google", "facebook"],
            default: "custom",
            required: false,
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            unique: true,
            required: true,
        },
        phone: {
            type: String,
            required: false,
        },
        password: {
            type: String,
            required: false,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
            required: false,
        },
        avatar: {
            type: String,
            required: false,
        },
        cloudinaryId: {
            type: String,
            required: false,
        },
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
            required: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
