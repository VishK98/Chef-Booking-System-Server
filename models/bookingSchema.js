const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true },
        bookingTime: { type: Date, required: true },
        chefID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chef",
            required: true,
        },
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        dishDetails: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Dish",
                required: true,
            },
        ],
        adultCount: { type: Number, required: true },
        childCount: { type: Number, required: true },
        subTotal: { type: Number, required: true },
        platformFee: { type: Number, required: true },
        promoDiscount: { type: Number, required: false, default: 5 },
        tax: { type: Number, required: false, default: 0 },
        totalFee: { type: Number, required: true },
        venue: {
            addressLine: { type: String, required: false, default: null },
            city: { type: String, required: false, default: null },
            state: { type: String, required: false, default: null },
            zipCode: { type: String, required: false, default: null },
        },
        additionalInfo: {
            type: String,
            required: false,
        },
        hasChefStarted: { type: Boolean, default: false },
        hasChefCompleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
