require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./database");

const app = express();
app.use(cors());
app.use(express.json());

// Session setup
app.use(
  session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Load models and Passport config
require("./models/User");
require("./services/passport");

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes"); // ✅ Add this line

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/api/invoice", invoiceRoutes); // ✅ Mount invoice route

// Connect to DB
connectDB();

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
