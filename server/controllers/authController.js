const passport = require('passport');

exports.authenticateGoogle = passport.authenticate('google', {
    scope: ['profile', 'email']
});

exports.handleGoogleRedirect = (req, res) => {
    res.status(200).send({ message: 'Authentication successful, welcome!' });
};
