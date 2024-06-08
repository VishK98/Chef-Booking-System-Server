const mongoose = require("mongoose");
const Chef = require("../models/chefSchema");
const User = require("../models/userSchema");
const Cuisine = require("../models/cuisineSchema");
const Dish = require("../models/dishSchema");
const Booking = require("../models/bookingSchema");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const myBucket = process.env.AWS_BUCKET_NAME;

const generateRandomPassword = () => {
    const lowerCaseChars = "abcdefghijklmnopqrstuvwxyz";
    const upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digits = "0123456789";
    const specialChars = "&$#@*";

    const getRandomChar = (charSet) => {
        const randomIndex = Math.floor(Math.random() * charSet.length);
        return charSet[randomIndex];
    };

    let password = "";
    password += getRandomChar(lowerCaseChars);
    password += getRandomChar(upperCaseChars);
    password += getRandomChar(digits);
    password += getRandomChar(specialChars);

    const remainingLength = 8 - password.length;
    for (let i = 0; i < remainingLength; i++) {
        const charSet = lowerCaseChars + upperCaseChars + digits + specialChars;
        password += getRandomChar(charSet);
    }

    const shuffledPassword = password
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
    return shuffledPassword;
};

const parseAndAdjustTime = (timeString) => {
    const [hours, minutes, seconds, period] = timeString.split(/:| /);
    let adjustedHours = parseInt(hours);
    if (period === "PM" && adjustedHours < 12) {
        adjustedHours += 12;
    } else if (period === "AM" && adjustedHours === 12) {
        adjustedHours = 0;
    }
    return new Date().setHours(
        adjustedHours,
        parseInt(minutes),
        parseInt(seconds),
        0
    );
};

module.exports.onboardChef = async (req, res, next) => {
    try {
        const { chef } = req.body;
        const { name, email, phoneNumber, bio, skills, dishes, pricePerHour } =
            chef;
        const rating = chef.rating
            ? chef.rating
            : (Math.random() * (5 - 4) + 4).toFixed(1);

        // handle cuisines
        const existingCuisineNames = (
            await Cuisine.find({ name: { $in: skills } })
        ).map((cuisine) => cuisine.name);
        const newCuisineNames = skills.filter(
            (name) => !existingCuisineNames.includes(name)
        );
        const newCuisines = await Cuisine.create(
            newCuisineNames.map((name) => ({
                _id: new mongoose.Types.ObjectId(),
                name,
            }))
        );
        const allCuisines = [...existingCuisineNames, ...newCuisineNames];

        // handle dishes
        const existingDishNames = (
            await Dish.find({ name: { $in: dishes } })
        ).map((dish) => dish.name);
        const newDishNames = dishes.filter(
            (name) => !existingDishNames.includes(name)
        );
        const newDishes = await Dish.create(
            newDishNames.map((name) => ({
                _id: new mongoose.Types.ObjectId(),
                name,
            }))
        );
        const allDishes = [...existingDishNames, ...newDishNames];

        const defaultStartTime = chef.serviceStartTime
            ? parseAndAdjustTime(chef.serviceStartTime)
            : new Date().setHours(10, 0, 0, 0);
        const defaultEndTime = chef.serviceEndTime
            ? parseAndAdjustTime(chef.serviceEndTime)
            : new Date().setHours(20, 0, 0, 0);

        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        const newId = new mongoose.Types.ObjectId();

        await Chef.create({
            name,
            email,
            _id: newId,
            password: hashedPassword,
            // accessToken: [token],
            phoneNumber: chef.phoneNumber ? chef.phoneNumber : "0000000000",
            bio,
            pricePerHour,
            skills: allCuisines,
            dishes: allDishes,
            serviceStartTime: defaultStartTime,
            serviceEndTime: defaultEndTime,
            rating,
        });

        req.chefOnboardLoginDetails = {
            chefName: name,
            chefEmail: email,
            chefPassword: password,
        };

        res.status(201).json({ message: "Chef onboarded successfully" });
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getAllChefs = async (req, res) => {
    try {
        const chefs = await Chef.find().sort({ rating: -1 }).lean();
        res.json({ totalChefs: chefs.length, chefs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getAllChefsByCuisine = async (req, res) => {
    try {
        const { cuisineName } = req.query;
        const chefs = await Chef.find({ skills: cuisineName });
        res.json({
            totalChefs: chefs.length,
            chefs,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getAllChefsByDish = async (req, res) => {
    try {
        const { dishName } = req.query;
        const chefs = await Chef.find({ dishes: dishName });
        res.json({
            totalChefs: chefs.length,
            chefs,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getAllCuisines = async (req, res) => {
    try {
        const { chefId } = req.query;
        const chef = await Chef.findOne({ _id: chefId });
        if (!chef) {
            return res.status(404).json({ error: "Chef not found" });
        }
        const { skills } = chef;
        res.json({ totalCuisines: skills.length, skills });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getAllDishes = async (req, res) => {
    try {
        const { chefId } = req.query;
        const chef = await Chef.findOne({ _id: chefId });
        if (!chef) {
            return res.status(404).json({ error: "Chef not found" });
        }
        const { dishes } = chef;
        res.json({ totalDishes: dishes.length, dishes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getChefById = async (req, res) => {
    try {
        const { chefId } = req.body;
        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }
        const chef = await Chef.findById(chefId);
        if (!chef) {
            return res.status(404).json({ error: "Chef not found" });
        }
        res.json({ chef });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getChefBookingsById = async (req, res) => {
    try {
        const { chefId } = req.body;
        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }
        const chef = await Chef.findById(chefId);
        if (!chef) {
            return res.status(404).json({ error: "Chef not found" });
        }
        const bookings = await Booking.find({ _id: { $in: chef.bookings } });
        const mappedBookings = bookings.map((booking) => ({
            startTime: booking.startTime,
            endTime: booking.endTime,
        }));
        res.json({ bookings: mappedBookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getSelfBookings = async (req, res) => {
    try {
        const { _id } = req.chef;
        const chefId = _id;

        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }
        const chef = await Chef.findById(chefId);
        if (!chef) {
            return res.status(404).json({ error: "Chef not found" });
        }
        const bookings = await Booking.find({ _id: { $in: chef.bookings } })
            .populate("userID", "name email phoneNumber")
            .populate({
                path: "dishDetails",
                model: "Dish",
                select: "name",
            })
            .select(
                "adultCount childCount startTime endTime totalFee dishDetails hasChefStarted hasChefCompleted userID chefID"
            );
        res.json({ bookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getCompletedBookings = async (req, res, next) => {
    try {
        const { _id } = req.chef;
        const chefId = _id;

        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }
        const chef = await Chef.findById(chefId);
        if (!chef) {
            return res.status(404).json({ error: "Chef not found" });
        }

        const currentDate = new Date();
        const completedBookings = await Booking.find({
            _id: { $in: chef.bookings },
            endTime: { $lt: currentDate },
        })
            .populate("userID", "name email phoneNumber")
            .populate({
                path: "dishDetails",
                model: "Dish",
                select: "name",
            })
            .select(
                "adultCount childCount startTime endTime totalFee dishDetails hasChefStarted hasChefCompleted userID chefID"
            );

        res.json({ completedBookings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.startSession = async (req, res, next) => {
    try {
        const { _id, name, email } = req.chef;
        const chefId = _id;

        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({ error: "Booking ID is required" });
        }

        const booking = await Booking.findById(bookingID);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        booking.hasChefStarted = true;
        await booking.save();

        res.status(200).json({ message: "Session started successfully" });

        const user = await User.findById(booking.userID);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // for mailing at session start
        const userName = user.name;
        const userEmail = user.email;
        const chefName = name;
        const chefEmail = email;
        const {
            startTime,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            adultCount,
            childCount,
            additionalInfo,
            dishDetails,
            venue,
        } = booking;
        const dishNames = await Promise.all(
            dishDetails.map(async (dishId) => {
                const dish = await Dish.findOne({ _id: dishId });
                if (dish) {
                    return dish.name;
                }
            })
        );
        const istTime = convertToIST(new Date(startTime));
        const istMoment = moment(istTime, "YYYY-MM-DD HH:mm:ss");
        const istDateObject = istMoment.toDate();
        const date = istMoment.format("YYYY-MM-DD");
        const time = istMoment.format("HH:mm:ss");

        req.bookingDetails = {
            userName,
            userEmail,
            chefName,
            chefEmail,
            bookingDate: istDateObject,
            date,
            time,
            adultCount,
            childCount,
            venue,
            dietaryRestrictions: additionalInfo,
            dishNames,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
        };
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.endSession = async (req, res, next) => {
    try {
        const { _id, name, email } = req.chef;
        const chefId = _id;

        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }

        const { bookingID } = req.body;

        if (!bookingID) {
            return res.status(400).json({ error: "Booking ID is required" });
        }

        const booking = await Booking.findById(bookingID);

        if (!booking) {
            return res.status(404).json({ error: "Booking not found" });
        }
        booking.hasChefCompleted = true;
        await booking.save();
        res.status(200).json({ message: "Session completed successfully" });
        const user = await User.findById(booking.userID);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // for mailing at session end
        const userName = user.name;
        const userEmail = user.email;
        const chefName = name;
        const chefEmail = email;
        const {
            startTime,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
            adultCount,
            childCount,
            additionalInfo,
            dishDetails,
            venue,
        } = booking;
        const dishNames = await Promise.all(
            dishDetails.map(async (dishId) => {
                const dish = await Dish.findOne({ _id: dishId });
                if (dish) {
                    return dish.name;
                }
            })
        );

        const istTime = convertToIST(new Date(startTime));
        const istMoment = moment(istTime, "YYYY-MM-DD HH:mm:ss");
        const istDateObject = istMoment.toDate();

        const date = istMoment.format("YYYY-MM-DD");
        const time = istMoment.format("HH:mm:ss");

        req.bookingDetails = {
            userName,
            userEmail,
            chefName,
            chefEmail,
            bookingDate: istDateObject,
            date,
            time,
            adultCount,
            childCount,
            venue,
            dietaryRestrictions: additionalInfo,
            dishNames,
            subTotal,
            platformFee,
            promoDiscount,
            tax,
            totalFee,
        };
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.logIn = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const chef = await Chef.findOne({ email });
        if (!chef) {
            return res.status(401).json({
                success: false,
                message: "Chef not found",
                redirectRoute: "/api/chefs/login",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, chef.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Email or password is incorrect.",
                redirectRoute: "/api/chefs/login",
            });
        }

        const isChefActive = chef.isActive;

        const chefEmail = chef.email;
        const chefId = chef._id;
        const chefName = chef.name;

        const ip = req.ip;
        const device = req.useragent.source;
        const loginTime = new Date().toLocaleString();

        req.chefLoginDetails = {
            ip: ip,
            device: device,
            loginTime: loginTime,
            chefName: chefName,
            chefEmail: chefEmail,
            isChefActive,
        };

        if (isChefActive) {
            const token = jwt.sign(
                { chefEmail, chefId },
                process.env.JWT_SECRET_KEY,
                {
                    expiresIn: "15d",
                }
            );
            chef.accessToken.push(token);
            await chef.save();
            res.status(200).header("Authorization", `Bearer ${token}`).json({
                success: true,
                message: "Authentication successful",
                chefName,
                chefEmail,
                redirectRoute: "/chef/profile",
            });
            next();
        } else {
            res.status(201).json({
                success: true,
                message: "Password Reset requested",
                chefName,
                chefEmail,
                redirectRoute: "/api/chefs/resetpassword",
            });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
            redirectRoute: "/api/chefs/login",
        });
    }
};

module.exports.resetPassword = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;
        const chef = await Chef.findOne({ email });
        if (!chef) {
            return res.status(401).json({
                success: false,
                message: "Chef not found",
                redirectRoute: "/api/chefs/login",
            });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        chef.password = hashedPassword;
        chef.isActive = true;

        const chefEmail = chef.email;
        const chefId = chef._id;
        const chefName = chef.name;
        const token = jwt.sign(
            { chefEmail, chefId },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "15d",
            }
        );
        chef.accessToken.push(token);

        await chef.save();

        const ip = req.ip;
        const device = req.useragent.source;
        const loginTime = new Date().toLocaleString();

        req.chefLoginDetails = {
            ip: ip,
            device: device,
            loginTime: loginTime,
            chefName: chefName,
            chefEmail: chefEmail,
            isChefActive: chef.isActive,
        };

        res.status(200).header("Authorization", `Bearer ${token}`).json({
            success: true,
            message: "Authentication successful",
            chefName,
            chefEmail,
            redirectRoute: "/chef/profile",
        });

        next();
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({
            success: false,
            message: "Error logging in",
            redirectRoute: "/api/chefs/login",
        });
    }
};

module.exports.getProfile = async (req, res) => {
    try {
        const { _id, name, email, phoneNumber, bio, image, skills } = req.chef;
        const chefId = _id;

        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }

        res.status(200).json({
            chefDetails: { name, email, phoneNumber, bio, image, skills },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: myBucket,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, callbackFn) {
            const key = "chefs/" + file.originalname;
            callbackFn(null, key);
        },
    }),
});

module.exports.uploadChefImage = async (req, res, next) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            console.error(err);
            return res
                .status(500)
                .json({ error: "Error in uploading chef image" });
        }
        next();
    });
};

module.exports.updateChefImage = async (req, res, next) => {
    try {
        const chef = req.chef;
        const chefId = chef._id;

        if (!chefId || chefId === null) {
            return res.status(400).json({ error: "Chef ID is required" });
        }

        const imageUrl = req.imageUrl;
        if (imageUrl) {
            chef.image = imageUrl;
            await chef.save();
        }
        res.status(201).json({
            message: "chef profile image uploaded successfully!",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};
