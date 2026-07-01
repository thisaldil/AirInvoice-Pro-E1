const { OAuth2Client } = require("google-auth-library");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const { publicUserSelect } = require("../middleware/auth.js");
const { sendOtpEmail } = require("../services/emailService.js");
const {
    clearAuthCookie,
    isProduction,
    setAuthCookie,
} = require("../utils/auth.js");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const normalizeEmail = (email) => email?.trim().toLowerCase();
const normalizeUsername = (username) => username?.trim().toLowerCase();

const generateOtp = () => String(crypto.randomInt(100000, 1000000));
const hashOtp = (otp) => bcrypt.hash(otp, 10);
const otpMatches = (otp, storedOtp) =>
    storedOtp?.startsWith("$2")
        ? bcrypt.compare(otp, storedOtp)
        : Promise.resolve(String(otp) === String(storedOtp));

const withDevOtp = (payload, emailResult) => {
    if (!isProduction && emailResult?.devOtp) {
        return { ...payload, devOtp: emailResult.devOtp };
    }

    return payload;
};

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

const startSession = async (res, user) => {
    user.lastLoginAt = new Date();
    await user.save();
    setAuthCookie(res, user);
};

const sendAuthResponse = async (res, user, message) => {
    await startSession(res, user);
    return res.status(200).json({
        success: true,
        message,
        user: toPublicUser(user),
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
        isAccountVerified: true,
    });

    await user.save();
    return user;
};

const register = async (req, res) => {
    try {
        if (handleValidation(req, res)) return;

        const { username, name, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "Missing Details" });
        }

        const normalizedEmail = normalizeEmail(email);
        const normalizedUsername = normalizeUsername(username);
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
        }).select("+verifyotpAttempts +verifyotpLastSentAt");

        if (existingUser) {
            if (existingUser.email !== normalizedEmail) {
                return res.status(409).json({
                    success: false,
                    message: "Username is already in use",
                });
            }

            if (existingUser.isAccountVerified) {
                return res.status(409).json({ success: false, message: "User already exists" });
            }

            if (
                existingUser.verifyotpLastSentAt &&
                Date.now() - existingUser.verifyotpLastSentAt.getTime() <
                    OTP_RESEND_COOLDOWN_MS
            ) {
                return res.status(429).json({
                    success: false,
                    message: "Please wait before requesting another OTP.",
                });
            }

            // User registered before but never verified — overwrite OTP and resend
            const otp = generateOtp();
            existingUser.verifyotp = await hashOtp(otp);
            existingUser.verifyotpExpireat = Date.now() + OTP_EXPIRY_MS;
            existingUser.verifyotpAttempts = 0;
            existingUser.verifyotpLastSentAt = new Date();
            await existingUser.save();
            const emailResult = await sendOtpEmail(existingUser.email, otp);

            return res.json(withDevOtp({
                success: true,
                message: emailResult?.skipped
                    ? "Account already registered but not verified. Email delivery is unavailable locally; use the OTP shown on the verification page."
                    : "Account already registered but not verified. A new OTP has been sent.",
                email: normalizedEmail,
            }, emailResult));
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const otp = generateOtp();

        const user = new User({
            username: normalizedUsername,
            name: name?.trim() || username.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            authProvider: "local",
            verifyotp: await hashOtp(otp),
            verifyotpExpireat: Date.now() + OTP_EXPIRY_MS,
            verifyotpAttempts: 0,
            verifyotpLastSentAt: new Date(),
            isAccountVerified: false,
        });

        await user.save();
        const emailResult = await sendOtpEmail(normalizedEmail, otp);

        return res.json(withDevOtp({
            success: true,
            message: emailResult?.skipped
                ? "Registration successful. Email delivery is unavailable locally; use the OTP shown on the verification page."
                : "Registration successful. Please verify the OTP sent to your email.",
            email: normalizedEmail,
        }, emailResult));
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
        if (handleValidation(req, res)) return;

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+verifyotp +verifyotpExpireat +verifyotpAttempts +tokenVersion"
        );

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        if (user.isAccountVerified) {
            return res.status(409).json({ success: false, message: "Account already verified" });
        }

        if (
            !user.verifyotp ||
            user.verifyotpExpireat < Date.now() ||
            user.verifyotpAttempts >= MAX_OTP_ATTEMPTS
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP. Please request a new one.",
            });
        }

        if (!(await otpMatches(String(otp), user.verifyotp))) {
            user.verifyotpAttempts += 1;
            if (user.verifyotpAttempts >= MAX_OTP_ATTEMPTS) {
                user.verifyotp = "";
                user.verifyotpExpireat = 0;
            }
            await user.save();
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        user.isAccountVerified = true;
        user.verifyotp = "";
        user.verifyotpExpireat = 0;
        user.verifyotpAttempts = 0;
        await user.save();

        setAuthCookie(res, user);

        return res.json({
            success: true,
            message: "Email verified successfully",
            user: toPublicUser(user),
        });
    } catch (error) {
        console.error("OTP Verification Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const resendOtp = async (req, res) => {
    try {
        if (handleValidation(req, res)) return;

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+verifyotpAttempts +verifyotpLastSentAt"
        );

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If the account exists, a new OTP has been sent.",
            });
        }

        if (user.isAccountVerified) {
            return res.status(409).json({ success: false, message: "Account already verified" });
        }

        if (
            user.verifyotpLastSentAt &&
            Date.now() - user.verifyotpLastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS
        ) {
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another OTP.",
            });
        }

        const otp = generateOtp();
        user.verifyotp = await hashOtp(otp);
        user.verifyotpExpireat = Date.now() + OTP_EXPIRY_MS;
        user.verifyotpAttempts = 0;
        user.verifyotpLastSentAt = new Date();
        await user.save();

        const emailResult = await sendOtpEmail(normalizedEmail, otp);

        return res.json(withDevOtp({
            success: true,
            message: emailResult?.skipped
                ? "Email delivery is unavailable locally; use the OTP shown on the verification page."
                : "OTP resent successfully",
        }, emailResult));
    } catch (error) {
        console.error("Resend OTP Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const login = async (req, res) => {
    try {
        if (handleValidation(req, res)) return;

        const { email, usernameOrEmail, password } = req.body;
        const identifier = usernameOrEmail || email;

        if (!identifier || !password) {
            return res.json({
                success: false,
                message: "Username/email and password are required",
            });
        }

        const user = await User.findOne({
            $or: [
                { email: normalizeEmail(identifier) },
                { username: normalizeUsername(identifier) },
            ],
        }).select(
            "+password +loginAttempts +loginLockedUntil +tokenVersion " +
            "+verifyotpAttempts +verifyotpLastSentAt"
        );

        if (!user || !user.password || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password",
            });
        }

        if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
            return res.status(429).json({
                success: false,
                message: "Too many login attempts. Please try again later.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.loginAttempts = (user.loginAttempts || 0) + 1;
            if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.loginLockedUntil = new Date(Date.now() + LOGIN_LOCK_MS);
                user.loginAttempts = 0;
            }
            await user.save();
            return res.status(401).json({
                success: false,
                message: "Invalid username/email or password",
            });
        }

        user.loginAttempts = 0;
        user.loginLockedUntil = undefined;

        if (!user.isAccountVerified) {
            let emailResult;
            const canResend =
                !user.verifyotpLastSentAt ||
                Date.now() - user.verifyotpLastSentAt.getTime() >=
                    OTP_RESEND_COOLDOWN_MS;

            if (canResend) {
                const otp = generateOtp();
                user.verifyotp = await hashOtp(otp);
                user.verifyotpExpireat = Date.now() + OTP_EXPIRY_MS;
                user.verifyotpAttempts = 0;
                user.verifyotpLastSentAt = new Date();
                await user.save();
                emailResult = await sendOtpEmail(user.email, otp);
            } else {
                await user.save();
            }

            return res.json(withDevOtp({
                success: false,
                requiresVerification: true,
                email: user.email,
                message: !canResend
                    ? "Account not verified. Use the most recently sent OTP."
                    : emailResult?.skipped
                    ? "Account not verified. Email delivery is unavailable locally; use the OTP shown on the verification page."
                    : "Account not verified. A new OTP has been sent to your email.",
            }, emailResult));
        }

        return sendAuthResponse(res, user, "Login successful");
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
        clearAuthCookie(res);

        return res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        clearAuthCookie(res);
        return res.status(500).json({ success: false, message: "Logout failed" });
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
            picture: req.body.picture?.trim(),
        };

        Object.keys(updates).forEach((key) => {
            if (!updates[key]) delete updates[key];
        });

        if (
            req.body.email &&
            normalizeEmail(req.body.email) !== req.user.email
        ) {
            return res.status(400).json({
                message: "Email changes require a separate verification flow",
            });
        }

        if (updates.username) {
            const duplicate = await User.findOne({
                _id: { $ne: req.user._id },
                username: updates.username,
            });

            if (duplicate) {
                return res.status(409).json({ message: "Username is already in use" });
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

        const user = await User.findById(req.user._id).select("+password +tokenVersion");
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
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        setAuthCookie(res, user);

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
            $inc: { tokenVersion: 1 },
        });

        clearAuthCookie(res);
        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete Account Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const handleGoogleRedirect = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        await startSession(res, req.user);
        const clientUrl =
            process.env.CLIENT_URL ||
            (isProduction
                ? "https://air-invoice-client.vercel.app"
                : "http://localhost:3000");
        return res.redirect(`${clientUrl.replace(/\/$/, "")}/dashboard`);
    } catch (error) {
        console.error("Google Redirect Error:", error);
        return res.status(500).json({ message: "Authentication failed" });
    }
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

        let user = await User.findOne({ googleId }).select("+tokenVersion");

        if (!user || !user.isActive || payload.email_verified !== true) {
            return res.status(404).json({ message: "User not found" });
        }

        return sendAuthResponse(res, user, "Authentication successful");
    } catch (error) {
        console.error("Google Token Handling Error:", error);
        res.status(401).json({ message: "Invalid Google credential" });
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
        if (payload.email_verified !== true) {
            return res.status(401).json({ message: "Google email is not verified" });
        }

        const existingUser = await User.findOne({
            $or: [{ googleId: payload.sub }, { email: normalizeEmail(payload.email) }],
        });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const user = await createUser({
            sub: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
        });

        return sendAuthResponse(res, user, "Registration successful");
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
