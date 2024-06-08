const mongoose = require("mongoose");

const chefSchema = new mongoose.Schema(
    {
        googleId: { type: String, required: false },
        _id: { type: mongoose.Schema.Types.ObjectId, required: true },
        name: { type: String, required: true },
        email: {
            type: String,
            required: true,
            validate: {
                // validator: function (v) {
                //     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                // },
                validator: function (v) {
                    return /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(
                        v
                    );
                },
                message: (props) =>
                    `${props.value} is not a valid email address!`,
            },
        },
        password: {
            type: String,
            required: false,
        },
        image: {
            type: String,
            default:
                "https://chefonwheelz.s3.ap-south-1.amazonaws.com/chefs/chef_teal_default.svg",
            required: false,
        },
        phoneNumber: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    const cleanedPhoneNumber = v.replace(/\s/g, "");
                    return /^\d+$/.test(cleanedPhoneNumber);
                },
                message: (props) =>
                    `${props.value} is not a valid phone number!`,
            },
        },
        bio: {
            type: String,
            required: true,
            maxlength: 700,
        },
        skills: {
            type: [String],
            required: true,
        },
        dishes: {
            type: [String],
            required: true,
        },
        serviceStartTime: {
            type: Date,
            default: new Date().setHours(10, 0, 0, 0),
            required: false,
        },
        serviceEndTime: {
            type: Date,
            default: new Date().setHours(20, 0, 0, 0),
            required: false,
        },
        rating: {
            type: Number,
            required: false,
            default: 5,
            index: -1,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: false,
            },
            coordinates: {
                type: [Number],
                required: false,
            },
        },
        pricePerHour: {
            type: Number,
            required: true,
            validate: {
                validator: function (v) {
                    return v > 0;
                },
                message: "Price per hour must be greater than 0",
            },
        },
        bookings: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Booking",
            },
        ],
        accessToken: [{ type: String, required: false }],
        refreshToken: { type: String, required: false, default: null },
        expiresAt: { type: Date },
        address: {
            addressLine: { type: String, required: false, default: null },
            city: { type: String, required: false, default: null },
            state: { type: String, required: false, default: null },
            zipCode: { type: String, required: false, default: null },
        },
        isActive: { type: Boolean, default: false },
    },
    { timestamps: true }
);

chefSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Chef", chefSchema);
