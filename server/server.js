require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

require('./models/User');
require('./services/passport');
const authRoutes = require('./routes/authRoutes');

app.use(passport.initialize());
app.use('/auth', authRoutes);

connectDB();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
