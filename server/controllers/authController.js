const passport = require('passport');

exports.authenticateGoogle = passport.authenticate('google', {
    scope: ['profile', 'email']
});

exports.handleGoogleRedirect = (req, res) => {
    console.log("Google Login Successful:", req.user);
    res.status(200).json({ message: "Authentication successful", user: req.user });
};
