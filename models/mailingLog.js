const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const validTypes = ["order-confirmation", "signup", "login"];

const mailingLogSchema = new Schema(
    {
        senderEmail: {
            type: String,
            required: true,
        },
        receiverEmail: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: validTypes,
            required: true,
        },
    },
    { timestamps: true }
);

const MailingLog = mongoose.model("MailingLog", mailingLogSchema);

module.exports = MailingLog;
