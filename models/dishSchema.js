const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    cuisine: { type: mongoose.Schema.Types.ObjectId, ref: "Cuisine" },
});

module.exports = mongoose.model("Dish", dishSchema);
