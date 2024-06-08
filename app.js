const dotenv = require("dotenv");

const envFile =
  process.env.NODE_ENV === "production" ? ".env.prod" : ".env.stage";
dotenv.config({ path: envFile });

const express = require("express");
const cors = require("cors");
const useragent = require("express-useragent");
const path = require("path");
// const passport = require("passport");
// const session = require("express-session");

// const loginRouter = require("./routers/loginRouter");
const chefRouter = require("./routers/chefRouter");
const cuisineRouter = require("./routers/cuisineRouter");
const dishRouter = require("./routers/dishRouter");
const userRouter = require("./routers/userRouter.js");
const visitCountRouter = require("./routers/visitCountRouter.js");

require("./db/dbConnect.js");

const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(useragent.express());
app.use(
  cors({
    origin: "*",
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
    exposedHeaders: "Authorization",
  })
);
// app.use(
//     session({
//         secret: process.env.SECRET_KEY,
//         resave: false,
//         saveUninitialized: true,
//     })
// );
// app.use(passport.initialize());
// app.use(passport.session());

// app.use("/login", loginRouter);
app.use("/api/chefs", chefRouter);
app.use("/api/cuisines", cuisineRouter);
app.use("/api/dishes", dishRouter);
app.use("/api/users", userRouter);
app.use("/cow-admin/visit", visitCountRouter);

const _dirname = path.dirname("");
const buildPath = path.join(_dirname, "../frontend/build");

app.use(express.static(buildPath));

app.get(
  [
    "/",
    "/booking",
    "/chefs-by-cuisine/:cuisineName",
    "/chefs-by-dish/:dishName",
    "/profile",
    "/usersessions",
    "/chef/sessions",
    "/chef/profile",
    "/chef/completed",
    "/chef/on-boarding",
  ],
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "../frontend/build/index.html"),
      function (err) {
        if (err) {
          res.status(500).send(err);
        }
      }
    );
  }
);

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
