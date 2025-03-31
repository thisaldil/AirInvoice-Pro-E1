const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("Google Profile ID:", profile.id);

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            console.log("Creating new user...");
            user = new User({ googleId: profile.id });
            await user.save();
            console.log("User saved successfully:", user);
        } else {
            console.log("User already exists:", user);
        }

        return done(null, user);
    } catch (err) {
        console.error("Error in Google Strategy:", err);
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});
