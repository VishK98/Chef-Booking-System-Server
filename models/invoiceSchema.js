const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    invoiceID: {
        type: Number,
        required: true,
        unique: true,
        default: 1000,
    },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);
module.exports = Invoice;
