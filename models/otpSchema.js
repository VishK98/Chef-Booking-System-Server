const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
        },
        sentOtp: {
            type: String,
            required: true,
        },
        generatedTime: {
            type: Date,
            required: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);
