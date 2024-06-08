const router = require("express").Router();

const {
    updateCount,
    getCount,
} = require("../controllers/visitCountController");

router.route("/").post(updateCount);
router.route("/").get(getCount);

module.exports = router;
