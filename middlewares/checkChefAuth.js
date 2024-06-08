const jwt = require("jsonwebtoken");
const Chef = require("../models/chefSchema");

const checkChefAuth = async (req, res, next) => {
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
        const chef = await Chef.findOne({
            email: decodedToken.chefEmail,
            _id: decodedToken.chefId,
        });
        if (!chef) {
            return res.status(401).json({
                success: false,
                message: "Invalid token. Chef not found.",
            });
        }
        req.chef = chef;
        next();
    } catch (error) {
        console.error("Error authenticating chef:", error);
        res.status(500).json({
            success: false,
            message: "Error authenticating chef",
        });
    }
};

module.exports = checkChefAuth;
