const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { publicUserSelect } = require("../middleware/auth.js");
const UserM = require("../models/userModel.js");
const { sendOtpEmail } = require("../services/emailService.js");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const normalizeEmail = (email) => email?.trim().toLowerCase();
const normalizeUsername = (username) => username?.trim().toLowerCase();

const generateOtp = () => Math.floor(100000 + Math.random() * 900000); // 6-digit

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
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const normalizedEmail = normalizeEmail(email);
        const existingUser = await UserM.findOne({ email: normalizedEmail });

        if (existingUser) {
            if (existingUser.isAccountVerified) {
                return res.json({ success: false, message: "User already exists" });
            }
            // User registered before but never verified — overwrite OTP and resend
            const otp = generateOtp();
            existingUser.verifyotp = otp;
            existingUser.verifyotpExpireat = Date.now() + OTP_EXPIRY_MS;
            await existingUser.save();
            const emailResult = await sendOtpEmail(normalizedEmail, otp);

            return res.json({
                success: true,
                message: emailResult?.skipped
                    ? "Account already registered but not verified. Email delivery is unavailable locally; check the server console for the OTP."
                    : "Account already registered but not verified. A new OTP has been sent.",
                email: normalizedEmail,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();

        const user = new UserM({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            verifyotp: otp,
            verifyotpExpireat: Date.now() + OTP_EXPIRY_MS,
            isAccountVerified: false,
        });

        await user.save();
        const emailResult = await sendOtpEmail(normalizedEmail, otp);

        return res.json({
            success: true,
            message: emailResult?.skipped
                ? "Registration successful. Email delivery is unavailable locally; check the server console for the OTP."
                : "Registration successful. Please verify the OTP sent to your email.",
            email: normalizedEmail,
        });
    } catch (error) {
        console.error("Registration Error:", error);
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0] || "field";
            const duplicateValue = error.keyValue ? error.keyValue[duplicateField] : "";
            console.error(`Duplicate key on field "${duplicateField}":`, duplicateValue);
            return res.status(409).json({
                success: false,
                message: `An account with this ${duplicateField} already exists`,
            });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.json({ success: false, message: "Email and OTP are required" });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await UserM.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" });
        }

        if (!user.verifyotp || String(user.verifyotp) !== String(otp)) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if (user.verifyotpExpireat < Date.now()) {
            return res.json({ success: false, message: "OTP has expired. Please request a new one." });
        }

        user.isAccountVerified = true;
        user.verifyotp = "";
        user.verifyotpExpireat = 0;
        await user.save();

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Email verified successfully",
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("OTP Verification Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await UserM.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account already verified" });
        }

        const otp = generateOtp();
        user.verifyotp = otp;
        user.verifyotpExpireat = Date.now() + OTP_EXPIRY_MS;
        await user.save();

        const emailResult = await sendOtpEmail(normalizedEmail, otp);

        return res.json({
            success: true,
            message: emailResult?.skipped
                ? "Email delivery is unavailable locally; check the server console for the OTP."
                : "OTP resent successfully",
        });
    } catch (error) {
        console.error("Resend OTP Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await UserM.findOne({ email: normalizedEmail });

        if (!user) {
            return res.json({ success: false, message: "Invalid email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid password" });
        }

        if (!user.isAccountVerified) {
            // Auto-send a fresh OTP so the user can verify right away
            const otp = generateOtp();
            user.verifyotp = otp;
            user.verifyotpExpireat = Date.now() + OTP_EXPIRY_MS;
            await user.save();
            const emailResult = await sendOtpEmail(normalizedEmail, otp);

            return res.json({
                success: false,
                requiresVerification: true,
                email: normalizedEmail,
                message: emailResult?.skipped
                    ? "Account not verified. Email delivery is unavailable locally; check the server console for the OTP."
                    : "Account not verified. A new OTP has been sent to your email.",
            });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        return res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
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
    verifyOtp,
    resendOtp,
    getCurrentUser,
    updateProfile,
    changePassword,
    deleteAccount,
    handleGoogleRedirect,
    handleGoogleToken,
    handleGoogleRegister,
    createUser,
};
