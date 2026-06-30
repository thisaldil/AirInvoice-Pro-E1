const mongoose = require('mongoose');
require('dotenv').config();

// URI in the .env file
const uri = process.env.URI;

const connectDB = async () => {
    if (!uri) {
        if (process.env.NODE_ENV !== 'deployment') {
            console.warn('Database connection skipped because URI is not set.');
        }
        return;
    }

    try {
        await mongoose.connect(uri);
        if (process.env.NODE_ENV !== 'deployment') {
            console.log('Database connection success');
        }
    } catch (err) {
        console.error('Database connection error: ' + err.message);
        process.exit(1); 
    }
};

module.exports = connectDB;
