const router = require("express").Router();

const {
    signUp,
    verify,
    logIn,
    resetPassword,
    resetUser,
    deleteUser,
    getUserAddress,
    updateUserAddress,
    deleteUserAddress,
    bookAppointment,
    logOut,
    getUserBookings,
} = require("../controllers/userController");

const checkUserAuth = require("../middlewares/checkUserAuth");

const {
    sendOTPEmail,
    sendSignUpEmail,
    sendLoginEmail,
    bookingConfirmationEmail,
    bookingConfirmationEmailToChef,
    sendUpcomingSessionReminderEmail,
    sendPasswordResetEmail,
    sendReceiptPDFToJig,
} = require("../middlewares/mailer");

router.route("/signup").post(signUp, function (req, res) {
    sendOTPEmail(req, res);
});

router.route("/verify").post(verify, function (req, res) {
    sendSignUpEmail(req, res);
});

router.route("/login").post(logIn, function (req, res) {
    sendLoginEmail(req, res);
});

router.route("/resetpassword").post(resetPassword, function (req, res) {
    sendPasswordResetEmail(req, res);
});

router.route("/resetuser").post(resetUser, function (req, res) {
    sendLoginEmail(req, res);
});

router.route("/logout").post(checkUserAuth, logOut);

router.route("/").delete(checkUserAuth, deleteUser);
router.route("/getaddress").post(checkUserAuth, getUserAddress);
router.route("/postaddress").post(checkUserAuth, updateUserAddress);
router.route("/deleteaddress").post(checkUserAuth, deleteUserAddress);

router.route("/book").post(
    checkUserAuth,
    bookAppointment,
    function (req, res, next) {
        bookingConfirmationEmail(req, res, next);
    },
    function (req, res, next) {
        bookingConfirmationEmailToChef(req, res, next);
    },
    function (req, res, next) {
        sendUpcomingSessionReminderEmail(req, res, next);
    }
);

router.route("/getbooking").post(checkUserAuth, getUserBookings);

module.exports = router;
