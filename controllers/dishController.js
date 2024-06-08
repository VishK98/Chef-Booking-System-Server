const mongoose = require("mongoose");
const Dish = require("../models/dishSchema");
const Cuisine = require("../models/cuisineSchema");

module.exports.addDishes = async (req, res) => {
    try {
        const { dishes } = req.body;
        if (!Array.isArray(dishes) || !dishes.length) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid request body format. 'dishes' must be a non-empty array.",
            });
        }

        const existingDishNames = (await Dish.find({})).map(
            (dish) => dish.name
        );

        const newDishes = [];
        for (const dish of dishes) {
            if (!existingDishNames.includes(dish.name)) {
                const newDish = await Dish.create({
                    name: dish.name,
                    _id: new mongoose.Types.ObjectId(),
                });
                newDishes.push(newDish);
            }
        }

        res.status(201).json({
            success: true,
            message: "Dishes added successfully",
            addedDishes: newDishes,
        });
    } catch (error) {
        console.error("Error adding dishes:", error);
        res.status(500).json({
            success: false,
            message: "Error adding dishes",
        });
    }
};

module.exports.getDishes = async (req, res) => {
    try {
        const dishes = await Dish.find();
        return res.json({ success: true, dishes });
    } catch (error) {
        console.error("Error fetching dishes:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dishes",
        });
    }
};

module.exports.getDishDetailsByName = async (req, res) => {
    try {
        const { dishName } = req.params;
        if (!dishName || typeof dishName !== "string") {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid request parameters. 'dishName' must be a string.",
            });
        }

        const dish = await Dish.findOne({ name: dishName });
        if (!dish) {
            return res.status(404).json({
                success: false,
                message: `Dish with name '${dishName}' not found.`,
            });
        }

        res.json({
            success: true,
            dishDetails: dish,
        });
    } catch (error) {
        console.error("Error fetching dish details:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dish details",
        });
    }
};

module.exports.updateCuisineReference = async (req, res) => {
    try {
        const { cuisineDishPairs } = req.params;
        const { cuisineName, dishNames } = cuisineDishPairs;
        let cuisine = await Cuisine.findOne({ name: cuisineName });
        if (!cuisine) {
            cuisine = await Cuisine.create({
                _id: new mongoose.Types.ObjectId(),
                name: cuisineName,
            });
        }
        for (const dishName of dishNames) {
            let dish = await Dish.findOne({ name: dishName });
            if (!dish) {
                dish = await Dish.create({
                    _id: new mongoose.Types.ObjectId(),
                    name: dishName,
                    cuisine: cuisine._id,
                });
            } else if (!dish.cuisine) {
                dish.cuisine = cuisine._id;
                await dish.save();
            }
        }
        res.status(200).json({
            success: true,
            message:
                "Cuisine references updated successfully in selected dishes",
        });
    } catch (error) {
        console.error("Error updating cuisine references:", error);
        res.status(500).json({
            success: false,
            message: "Error updating cuisine references",
        });
    }
};
