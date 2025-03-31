const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authenticateGoogle = passport.authenticate('google', {
    scope: ['profile', 'email']
});

exports.handleGoogleRedirect = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication failed" });
    }

    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    try {
        await User.findByIdAndUpdate(req.user._id, { token });

        res.status(200).json({
            message: "Authentication successful",
            user: req.user,
            token
        });
    } catch (error) {
        res.status(500).json({ message: "Error saving token", error });
    }
};
