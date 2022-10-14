const mongoose = require('mongoose');

const resetPasswordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    resetPasswordToken: {
        type: String,
        required: true
    }
}, { timestamps: true });

resetPasswordSchema.index({ 'updatedAt': 1 }, { expireAfterSeconds: 3600 });


module.exports = mongoose.model('ResetPassword', resetPasswordSchema);