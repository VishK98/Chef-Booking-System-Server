const mongoose = require("mongoose");

const visitCountSchema = new mongoose.Schema({
    pageRoute: {
        type: String,
        required: true,
    },
    visits: {
        type: Number,
        required: true,
    },
    pageViews: {
        type: Number,
        required: true,
    },
});

const VisitCount = mongoose.model("VisitCount", visitCountSchema);

module.exports = VisitCount;
