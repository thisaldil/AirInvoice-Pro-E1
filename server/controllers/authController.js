const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { publicUserSelect } = require("../middleware/auth");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const normalizeEmail = (email) => email?.trim().toLowerCase();
const normalizeUsername = (username) => username?.trim().toLowerCase();

const toPublicUser = (user) => ({
    _id: user._id,
    id: user._id,
    username: user.username,
    name: user.name,
    email: user.email,
    picture: user.picture,
    authProvider: user.authProvider,
    role: user.role,
});

const signToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        return null;
    }
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

const startSession = async (req, user) => {
    const token = signToken(user._id);
    req.session.userId = user._id.toString();
    await User.findByIdAndUpdate(user._id, {
        token,
        lastLoginAt: new Date(),
    });
    return token;
};

const sendAuthResponse = async (req, res, user, message) => {
    const token = await startSession(req, user);
    return res.status(200).json({
        message,
        user: toPublicUser(user),
        token,
        userId: user._id,
    });
};

const handleValidation = (req, res) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return false;
    }

    res.status(400).json({
        message: "Validation failed",
        errors: errors.array().map((error) => ({
            field: error.path,
            message: error.msg,
        })),
    });
    return true;
};

const createUser = async (payload) => {
    const googleId = payload.sub;
    const imageUrl = payload.picture;

    const user = new User({
        googleId,
        name: payload.name,
        email: normalizeEmail(payload.email),
        picture: imageUrl,
        authProvider: "google",
    });

    await user.save();
    return user;
};

const register = async (req, res) => {
    try {
        if (handleValidation(req, res)) return;

        const username = normalizeUsername(req.body.username);
        const email = normalizeEmail(req.body.email);
        const name = req.body.name?.trim() || username;
        const { password } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(409).json({
                message:
                    existingUser.email === email
                        ? "Email is already registered"
                        : "Username is already taken",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            username,
            name,
            email,
            password: hashedPassword,
            authProvider: "local",
        });

        return sendAuthResponse(req, res, user, "Registration successful");
    } catch (error) {
        console.error("Registration Error:", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "User already exists" });
        }
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const login = async (req, res) => {
    try {
        if (handleValidation(req, res)) return;

        const usernameOrEmail = req.body.usernameOrEmail.trim().toLowerCase();
        const { password } = req.body;

        const user = await User.findOne({
            $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
        }).select("+password");

        if (!user || !user.password) {
            return res.status(401).json({ message: "Invalid username/email or password" });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: "This account is disabled" });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: "Invalid username/email or password" });
        }

        return sendAuthResponse(req, res, user, "Login successful");
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const logout = async (req, res) => {
    const userId = req.session?.userId;

    if (userId) {
        await User.findByIdAndUpdate(userId, { $unset: { token: "" } });
    }

    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({ message: "Could not logout" });
        }

        res.clearCookie("airinvoice.sid");
        return res.status(200).json({ message: "Logout successful" });
    });
};

const getCurrentUser = async (req, res) => {
    return res.status(200).json({ user: toPublicUser(req.user) });
};

const updateProfile = async (req, res) => {
    try {
        if (handleValidation(req, res)) return;

        const updates = {
            name: req.body.name?.trim(),
            username: normalizeUsername(req.body.username),
            email: normalizeEmail(req.body.email),
            picture: req.body.picture?.trim(),
        };

        Object.keys(updates).forEach((key) => {
            if (!updates[key]) delete updates[key];
        });

        if (updates.email || updates.username) {
            const duplicate = await User.findOne({
                _id: { $ne: req.user._id },
                $or: [
                    ...(updates.email ? [{ email: updates.email }] : []),
                    ...(updates.username ? [{ username: updates.username }] : []),
                ],
            });

            if (duplicate) {
                return res.status(409).json({ message: "Email or username is already in use" });
            }
        }

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        }).select(publicUserSelect);

        return res.status(200).json({
            message: "Profile updated successfully",
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error("Profile Update Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const changePassword = async (req, res) => {
    try {
        if (handleValidation(req, res)) return;

        const user = await User.findById(req.user._id).select("+password");
        if (!user.password) {
            return res.status(400).json({
                message: "Password changes are only available for email/password accounts",
            });
        }

        const matches = await bcrypt.compare(req.body.currentPassword, user.password);
        if (!matches) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(req.body.newPassword, 12);
        await user.save();

        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Password Change Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteAccount = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            isActive: false,
            $unset: { token: "" },
        });

        req.session.destroy(() => {
            res.clearCookie("airinvoice.sid");
            return res.status(200).json({ message: "Account deleted successfully" });
        });
    } catch (error) {
        console.error("Delete Account Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const handleGoogleRedirect = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication failed" });
    }

    return sendAuthResponse(req, res, req.user, "Authentication successful");
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

        let user = await User.findOne({ googleId });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return sendAuthResponse(req, res, user, "Authentication successful");
    } catch (error) {
        console.error("Google Token Handling Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const handleGoogleRegister = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: "Token missing" });

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const existingUser = await User.findOne({ googleId: payload.sub });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const user = await createUser({
            sub: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
        });

        return sendAuthResponse(req, res, user, "Registration successful");
    } catch (error) {
        console.error("Google Register Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
    deleteAccount,
    handleGoogleRedirect,
    handleGoogleToken,
    handleGoogleRegister,
    createUser,
};
