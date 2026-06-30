const User = require("../models/User");

exports.getUserDetails = async (req, res) => {
    try {
        const requestUserId = req.userId || req.user?._id?.toString();

        if (req.params.userId && req.params.userId !== requestUserId) {
            return res.status(403).json({ error: "You do not have access to this user's data" });
        }

        const user = await User.findById(requestUserId).select("-password -token -__v");
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.json(user);
    } catch (err) {
        console.error("Error fetching user details:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
