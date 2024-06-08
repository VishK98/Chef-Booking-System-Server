const router = require("express").Router();

const {
    onboardChef,
    logIn,
    resetPassword,
    getAllChefs,
    getAllChefsByCuisine,
    getAllChefsByDish,
    getAllCuisines,
    getAllDishes,
    getChefById,
    getChefBookingsById,
    getSelfBookings,
    getCompletedBookings,
    startSession,
    endSession,
    getProfile,
    uploadChefImage,
    updateChefImage,
} = require("../controllers/chefController");

const checkChefAuth = require("../middlewares/checkChefAuth");

const {
    sendChefOnboardLoginEmail,
    sendChefLoginEmail,
    sendSessionStartedEmail,
    sendReceiptPDF,
} = require("../middlewares/mailer");

router.route("/onboard").post(onboardChef, function (req, res) {
    sendChefOnboardLoginEmail(req, res);
});

router.route("/login").post(logIn, function (req, res) {
    sendChefLoginEmail(req, res);
});

router.route("/resetpassword").post(resetPassword, function (req, res) {
    sendChefLoginEmail(req, res);
});

router.route("/").get(getAllChefs);
router.route("/bycuisine").get(getAllChefsByCuisine);
router.route("/bydish").get(getAllChefsByDish);
router.route("/allcuisines").get(getAllCuisines);
router.route("/alldishes").get(getAllDishes);
router.route("/getchefbyid").post(getChefById);
router.route("/getchefbookings").post(getChefBookingsById);
router.route("/getbookings").post(checkChefAuth, getSelfBookings);
router.route("/getcompletebookings").post(checkChefAuth, getCompletedBookings);

router
    .route("/startsession")
    .post(checkChefAuth, startSession, function (req, res, next) {
        sendSessionStartedEmail(req, res, next);
    });

router
    .route("/endsession")
    .post(checkChefAuth, endSession, function (req, res, next) {
        sendReceiptPDF(req, res, next);
    });

router.route("/getprofile").post(checkChefAuth, getProfile);

router.route("/upload").post(
    checkChefAuth,
    uploadChefImage,
    (req, res, next) => {
        const imageUrl = req.file.location;
        if (imageUrl) {
            console.log("Image uploaded successfully");
            req.imageUrl = imageUrl;
            next();
        } else {
            console.error("Failed to get image URL");
            next();
        }
    },
    function (req, res, next) {
        updateChefImage(req, res, next);
    }
);

module.exports = router;
