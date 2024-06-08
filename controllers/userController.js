const mongoose = require("mongoose");
const User = require("../models/userSchema");
const Chef = require("../models/chefSchema");
const Cuisine = require("../models/cuisineSchema");
const Dish = require("../models/dishSchema");
const Booking = require("../models/bookingSchema");
const OTP = require("../models/otpSchema");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const moment = require("moment-timezone");

const convertToIST = (timeInput) => {
    const inputFormat = "YYYY-MM-DD HH:mm:ss";
    const istTime = moment(timeInput).tz("Asia/Kolkata");
    return istTime.format(inputFormat);
};

// const getDate = (istTime) => {
//     const istMoment = moment(istTime, "YYYY-MM-DD HH:mm:ss");
//     const istDate = istMoment.format("YYYY-MM-DD");
//     return istDate;
// };

// const getTime = (istTime) => {
//     const istMoment = moment(istTime, "YYYY-MM-DD HH:mm:ss");
//     const istTime = istMoment.format("HH:mm:ss");
//     return istTime;
// };

module.exports.signUp = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message:
                    "Email already exists. Please log in with your credentials.",
                redirectRoute: "/api/users/login",
            });
        }
        req.otpGenerationTime = new Date(
            new Date().getTime() + 120000
        ).toUTCString();
        next();
    } catch (error) {
        console.error("Error signing up:", error);
        res.status(500).json({
            success: false,
            message: "Error signing up",
            error: error.message,
            redirectRoute: "/api/users/signup",
        });
    }
};

module.exports.verify = async (req, res, next) => {
    try {
        const { name, email, password, otp } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message:
                    "Email already exists. Please log in with your credentials.",
                redirectRoute: "/api/users/login",
            });
        }
        const otpDoc = await OTP.find({ email })
            .sort({ generatedTime: -1 })
            .limit(1);

        if (!otpDoc || otpDoc.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No valid OTP found.",
                redirectRoute: "/api/users/signup",
            });
        }

        const otpGeneratedTime = otpDoc.generatedTime;
        const currentTime = new Date().toUTCString();

        if (currentTime > otpGeneratedTime) {
            await OTP.deleteMany({ email });
            return res.status(400).json({
                success: false,
                message: "OTP has expired.",
                redirectRoute: "/api/users/signup",
            });
        }

        if (otp !== otpDoc[0].sentOtp.toString()) {
            await OTP.deleteMany({ email });
            return res.status(400).json({
                success: false,
                message: "OTP did not match.",
                redirectRoute: "/api/users/signup",
            });
        }

        await OTP.deleteMany({ email });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newId = new mongoose.Types.ObjectId();

        const token = jwt.sign(
            { userEmail: email, userId: newId },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "15d" }
        );
        const newUser = await User.create({
            name,
            email,
            _id: newId,
            password: hashedPassword,
            accessToken: token,
        });

        const ip = req.ip;
        const device = req.useragent.source;
        const loginTime = new Date().toLocaleString();

        req.signupDetails = {
            ip: ip,
            device: device,
            loginTime: loginTime,
            userName: name,
            userEmail: email,
        };

        res.status(201).header("Authorization", `Bearer ${token}`).json({
            success: true,
            message: "User created successfully",
            userName: name,
            userEmail: email,
            redirectRoute: "/",
        });

        next();
    } catch (error) {
        console.error("Error signing up:", error);
        res.status(500).json({
            success: false,
            message: "Error signing up",
            error: error.message,
        });
    }
};

module.exports.logIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found. Please sign up first.",
                redirectRoute: "/api/users/signup",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication failed. Email or password is incorrect.",
                redirectRoute: "/api/users/resetpassword",
            });
        }

        const userEmail = user.email;
        const userId = user._id;
        const userName = user.name;
        const token = jwt.sign(
            { userEmail, userId },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "15d",
            }
        );

        user.accessToken = token;
        await user.save();

        const ip = req.ip;
        const device = req.useragent.source;
        const loginTime = new Date().toLocaleString();

        req.loginDetails = {
            ip: ip,
            device: device,
            loginTime: loginTime,
            userName: userName,
            userEmail: userEmail,
        };

        res.status(200).header("Authorization", `Bearer ${token}`).json({
            success: true,
            message: "Authentication successful",
            userName,
            userEmail,
            redirectRoute: "/",
        });

        next();
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
        });
    }
};

module.exports.resetPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "Account does not exist. Please signup",
                redirectRoute: "/api/users/signup",
            });
        }
        req.otpGenerationTime = new Date(
            new Date().getTime() + 120000
        ).toUTCString();

        next();
    } catch (error) {
        console.error("Error reseting password", error);
        res.status(500).json({
            success: false,
            message: "Error reseting password",
            error: error.message,
            redirectRoute: "/api/users/login",
        });
    }
};

module.exports.resetUser = async (req, res, next) => {
    try {
        const { email, password, otp } = req.body;
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "Account does not exist. Please signup",
                redirectRoute: "/api/users/signup",
            });
        }

        const otpDoc = await OTP.find({ email })
            .sort({ generatedTime: -1 })
            .limit(1);
        if (!otpDoc || otpDoc.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No valid OTP was found.",
                redirectRoute: "/api/users/login",
            });
        }

        const otpGeneratedTime = otpDoc.generatedTime;
        const currentTime = new Date().toUTCString();

        if (currentTime > otpGeneratedTime) {
            await OTP.deleteMany({ email });
            return res.status(400).json({
                success: false,
                message: "OTP has expired.",
                redirectRoute: "/api/users/login",
            });
        }

        if (otp !== otpDoc[0].sentOtp.toString()) {
            await OTP.deleteMany({ email });
            return res.status(400).json({
                success: false,
                message: "OTP did not match.",
                redirectRoute: "/api/users/login",
            });
        }

        await OTP.deleteMany({ email });

        const hashedPassword = await bcrypt.hash(password, 10);

        const token = jwt.sign(
            { userEmail: email, userId: existingUser._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "15d" }
        );
        await User.findOneAndUpdate(
            { email },
            { password: hashedPassword, accessToken: token },
            { new: true }
        );

        const ip = req.ip;
        const device = req.useragent.source;
        const loginTime = new Date().toLocaleString();

        req.loginDetails = {
            ip: ip,
            device: device,
            loginTime: loginTime,
            userName: existingUser.name,
            userEmail: email,
        };

        res.status(201).header("Authorization", `Bearer ${token}`).json({
            success: true,
            message: "User created successfully",
            userName: existingUser.name,
            userEmail: email,
            redirectRoute: "/",
        });

        next();
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({
            success: false,
            message: "Error resetting password",
            error: error.message,
        });
    }
};

module.exports.logOut = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        user.accessToken = null;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ success: false, message: "Error logging out" });
    }
};

module.exports.deleteUser = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOneAndDelete({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting user",
        });
    }
};
module.exports.getUserAddress = async (req, res) => {
    try {
        const user = req.user;
        const addressWithPhoneNumber = {
            address: user.address,
            phoneNumber: user.phoneNumber
        };
        res.json(addressWithPhoneNumber);
    } catch (error) {
        console.error("Error fetching user's address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports.updateUserAddress = async (req, res) => {
    try {
        const { phoneNumber, addressLine, city, state, zipCode } = req.body;
        const userId = req.user._id;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.address = { addressLine, city, state, zipCode };
        user.phoneNumber = phoneNumber;
        await user.save();
        res.status(200).json({ message: "User Info updated successfully" });
    } catch (error) {
        console.error("Error updating user's address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.deleteUserAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        user.address = null;
        // user.phoneNumber = null;
        await user.save();
        res.status(200).json({ message: "User address deleted successfully" });
    } catch (error) {
        console.error("Error deleting user's address:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


module.exports.bookAppointment = async (req, res, next) => {
    try {
        const {
            chefId,
            startTime,
            endTime,
            bookingTime,
            dishDetails,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            adultCount,
            childCount,
            additionalInfo,
        } = req.body;

        const user = req.user;
        const userId = user._id;
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const chef = await Chef.findById(chefId);
        if (!chef) {
            return res.status(404).json({ error: "Chef not found" });
        }

        // Checking for booking clashes
        const existingBooking = await Booking.findOne({
            chefID: chefId,
            startTime: new Date(startTime),
        });

        if (existingBooking) {
            return res
                .status(400)
                .json({ error: "Chef already has a booking at this time" });
        }

        const dishIds = await Promise.all(
            dishDetails.map(async (dishName) => {
                const dish = await Dish.findOne({ name: dishName });
                if (dish) {
                    return dish._id;
                }
            })
        );

        const newBooking = await Booking.create({
            userID: userId,
            chefID: chefId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            bookingTime: new Date(bookingTime),
            dishDetails: dishIds,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            adultCount,
            childCount,
            additionalInfo,
            venue: user.address,
        });

        user.bookings.push(newBooking._id);
        chef.bookings.push(newBooking._id);
        await user.save();
        await chef.save();

        const istTime = convertToIST(new Date(startTime));
        const istMoment = moment(istTime, "YYYY-MM-DD HH:mm:ss");
        const istDateObject = istMoment.toDate();

        const date = istMoment.format("YYYY-MM-DD");
        const time = istMoment.format("HH:mm:ss");

        req.bookingDetails = {
            userName: user.name,
            userEmail: user.email,
            chefName: chef.name,
            chefEmail: chef.email,
            bookingDate: istDateObject,
            date,
            time,
            adultCount: newBooking.adultCount,
            childCount: newBooking.childCount,
            dietaryRestrictions: additionalInfo,
            venue: newBooking.venue,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee: newBooking.totalFee,
            dishDetails,
        };

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: {
                userDetails: {
                    userName: user.name,
                    userEmail: user.email,
                    userPhoneNumber: user.phoneNumber,
                },
                chefDetails: {
                    chefName: chef.name,
                    chefRating: chef.rating,
                },
                subTotal,
                platformFee,
                promoDiscount,
                tax,
                totalFee,
                adultCount,
                childCount,
                startTime,
                endTime,
                bookingTime,
                dishDetails,
                bookingId: newBooking._id,
                venue: newBooking.venue,
                additionalInfo: newBooking.additionalInfo,
            },
        });

        next();
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error creating booking",
        });
    }
};

module.exports.getUserBookings = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const bookings = await Booking.find({ _id: { $in: user.bookings } })
            .populate("chefID", "name rating image")
            .populate({
                path: "dishDetails",
                model: "Dish",
                select: "name",
            })
            .select(
                "adultCount childCount startTime endTime totalFee dishDetails hasChefStarted hasChefCompleted chefID"
            );

        res.status(200).json({
            success: true,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            address: user.address,
            bookings,
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
        });
    }
};
