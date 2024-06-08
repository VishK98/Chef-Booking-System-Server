const mongoose = require("mongoose");
const databaseURL = process.env.MONGODB_URL;

mongoose
    .connect(databaseURL)
    .then(() => {
        console.log(databaseURL);
        console.log("Connected to Database");
    })
    .catch((err) => {
        console.log(err);
    });
