const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const handleGoogleRedirect = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication failed" });
    }

    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    await User.findByIdAndUpdate(req.user._id, { token });

    res.status(200).json({ message: "Authentication successful", user: req.user, token });
};

const handleGoogleToken = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Token missing" });
        }

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const imageUrl = payload.picture.replace("=s96-c", "");

        let user = await User.findOne({ googleId });

        if (!user) {
            user = new User({
                googleId,
                name: payload.name,
                email: payload.email,
                picture: imageUrl
            });
            await user.save();
        } else {
            user.name = payload.name;
            user.email = payload.email;
            user.picture = imageUrl;
            await user.save();
        }

        const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

        await User.findByIdAndUpdate(user._id, { token: jwtToken });

        res.status(200).json({
            message: "Authentication successful",
            user: {
                googleId: user.googleId,
                name: user.name,
                email: user.email,
                picture: user.picture,
            },
            token: jwtToken
        });
    } catch (error) {
        console.error("Google Token Handling Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    handleGoogleRedirect,
    handleGoogleToken,
};
