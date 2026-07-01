const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const { createUser } = require('../controllers/authController'); 
const { isProduction } = require('../utils/auth');
require('dotenv').config();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const backendUrl = (
        process.env.BACKEND_URL ||
        (isProduction
            ? "https://air-invoice-pro-jd9l.vercel.app"
            : "http://localhost:5000")
    ).replace(/\/$/, "");

    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            `${backendUrl}/api/auth/google/callback`,
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id }).select("+tokenVersion");

            if (!user) {
                const email = profile.emails?.[0]?.value;
                if (!email || profile._json?.email_verified === false) {
                    return done(new Error("Google did not provide a verified email"));
                }

                const emailOwner = await User.findOne({ email: email.toLowerCase() });
                if (emailOwner) {
                    return done(new Error("An account already exists for this email"));
                }

                const payload = {
                    sub: profile.id,
                    name: profile.displayName,
                    email,
                    picture: profile.photos?.[0]?.value
                };
                user = await createUser(payload);
            } else {
                if (!user.isActive) {
                    return done(null, false);
                }
                user.name = profile.displayName;
                user.picture = profile.photos?.[0]?.value;
                user.isAccountVerified = true;
                await user.save();
            }

            return done(null, user);
        } catch (err) {
            console.error("Error in Google Strategy:", err);
            return done(err, null);
        }
    }));
} else if (!isProduction) {
    console.warn("Google OAuth is disabled because GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.");
}
