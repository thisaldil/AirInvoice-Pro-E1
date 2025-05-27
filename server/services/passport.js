const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');
const { createUser } = require('../controllers/authController'); 
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://air-invoice-server.vercel.app/auth/google/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            const payload = {
                sub: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                picture: profile.photos[0].value
            };
            user = await createUser(payload);
        } else {
            user.name = profile.displayName;
            user.email = profile.emails[0].value;
            user.picture = profile.photos[0].value;
            await user.save();
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
