const router = require("express").Router();

const {
    addCuisines,
    getCuisines,
    getCuisineDetailsByName,
} = require("../controllers/cuisineController");

router.route("/").post(addCuisines);
router.route("/").get(getCuisines);
router.route("/:cuisineName").get(getCuisineDetailsByName);

module.exports = router;
