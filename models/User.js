const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        index: true
    },
    isVerified: {
        type: Boolean,
        default: false,
        index: true
    },
    otp: {
        type: String
    },
    otpExpire: {
        type: Date
    },
    resetPasswordOTP: {
        type: String
    },
    resetPasswordOTPExpire: {
        type: Date
    }
}, { timestamps: true });

// Index for authentication queries
UserSchema.index({ email: 1, role: 1 });

module.exports = mongoose.model('User', UserSchema);