const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const { google } = require("googleapis");
const User = require("../model/userSchema");

// app.use(passport.initialize());
// app.use(passport.session());

passport.use(
    new OAuth2Strategy(
        {
            clientID: `${process.env.GOOGLE_CLIENT_ID}`,
            clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
            callbackURL: "/login/auth/google/callback",
            accessType: "offline",
            scope: [
                "profile",
                "email",
                "https://www.googleapis.com/auth/calendar",
            ],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        image: profile.photos[0].value,
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // expiresAt to 7 days from now
                    });
                    await user.save();
                } else {
                    user.accessToken = accessToken;
                    user.refreshToken = refreshToken;
                    user.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // expiresAt to 7 days from now
                    await user.save();
                }
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// OAuth authentication handler
module.exports.handleOAuth = passport.authenticate("google", {
    scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
});

// Callback for OAuth authentication
module.exports.handleOAuthCallback = passport.authenticate("google", {
    successRedirect: "http://localhost:3000/dashboard",
    failureRedirect: "http://localhost:3000/login",
});

module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    console.log("NOT AUTHORISED");
    res.status(401).json({ message: "User not authenticated" });
};

// Logout logic
module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("http://localhost:3000");
    });
};
