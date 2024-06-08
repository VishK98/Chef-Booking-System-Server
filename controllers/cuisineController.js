const Cuisine = require("../models/cuisineSchema");
const mongoose = require("mongoose");

module.exports.addCuisines = async (req, res) => {
    try {
        const { cuisineNames } = req.body;
        if (!cuisineNames || !Array.isArray(cuisineNames)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid request body format. 'cuisineNames' must be an array of cuisine names.",
            });
        }
        const existingCuisines = await Cuisine.find({
            name: { $in: cuisineNames },
        });
        const existingCuisineNames = existingCuisines.map(
            (cuisine) => cuisine.name
        );
        const newCuisineNames = cuisineNames.filter(
            (name) => !existingCuisineNames.includes(name)
        );
        const newCuisines = newCuisineNames.map(
            (name) => new Cuisine({ _id: new mongoose.Types.ObjectId(), name })
        );
        await Promise.all(newCuisines.map((cuisine) => cuisine.save()));
        res.status(201).json({
            success: true,
            message: "Cuisines added successfully",
            addedCuisines: newCuisineNames,
        });
    } catch (error) {
        console.error("Error adding cuisines:", error);
        res.status(500).json({
            success: false,
            message: "Error adding cuisines",
        });
    }
};

module.exports.getCuisines = async (req, res) => {
    try {
        const cuisines = await Cuisine.find();
        return res.json({ success: true, cuisines });
    } catch (error) {
        console.error("Error fetching cuisines:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching cuisines",
        });
    }
};

module.exports.getCuisineDetailsByName = async (req, res) => {
    try {
        const { cuisineName } = req.params;
        if (!cuisineName || typeof cuisineName !== "string") {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid request parameters. 'cuisineName' must be a string.",
            });
        }
        const cuisine = await Cuisine.findOne({ name: cuisineName });
        if (!cuisine) {
            return res.status(404).json({
                success: false,
                message: `Cuisine with name '${cuisineName}' not found.`,
            });
        }
        return res.json({ success: true, cuisine });
    } catch (error) {
        console.error("Error fetching cuisine details:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching cuisine details",
        });
    }
};
