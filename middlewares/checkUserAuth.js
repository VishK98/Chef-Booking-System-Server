const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const checkUserAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "No token provided. Please provide a valid token.",
        });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findOne({
            email: decodedToken.userEmail,
            _id: decodedToken.userId,
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. User not found.",
            });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("Error authenticating user:", error);
        res.status(500).json({
            success: false,
            message: "Error authenticating user",
        });
    }
};

module.exports = checkUserAuth;
