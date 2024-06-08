const router = require("express").Router();

const {
    addDishes,
    getDishes,
    getDishDetailsByName,
    updateCuisineReference,
} = require("../controllers/dishController");

router.route("/").post(addDishes);
router.route("/").get(getDishes);
router.route("/:dishName").get(getDishDetailsByName);
router.post("/:cuisineDishPairs", updateCuisineReference);

module.exports = router;
