const express = require("express");
const loginController = require("../controller/loginController");

const loginRouter = express.Router();

loginRouter.get("/auth/google", loginController.handleOAuth);
loginRouter.get("/auth/google/callback", loginController.handleOAuthCallback);
loginRouter.get("/logout", loginController.logout);

module.exports = loginRouter;
