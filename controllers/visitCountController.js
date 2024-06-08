const mongoose = require("mongoose");
const VisitCount = require("../models/visitCountSchema");

module.exports.updateCount = async (req, res) => {
    const { pageRoute, visits, pageViews } = req.body;
    try {
        let visitCount = await VisitCount.findOne({ pageRoute });
        if (!visitCount) {
            visitCount = new VisitCount({
                pageRoute,
                visits,
                pageViews,
            });
        } else {
            visitCount.visits += visits;
            visitCount.pageViews += pageViews;
        }
        await visitCount.save();

        res.status(200).json({ message: "Visit count updated successfully" });
    } catch (error) {
        console.error("Error updating visit count:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getCount = async (req, res) => {
    try {
        const visitCounts = await VisitCount.find();
        res.status(200).json(visitCounts);
    } catch (error) {
        console.error("Error getting visit counts:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
