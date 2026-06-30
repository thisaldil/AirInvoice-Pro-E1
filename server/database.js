const mongoose = require('mongoose');
require('dotenv').config();

// URI in the .env file
const uri = process.env.URI;

const ensureUserIndexes = async () => {
    const User = require('./models/User');
    const indexes = await User.collection.indexes();
    const googleIdIndex = indexes.find((index) => index.name === 'googleId_1');
    const hasCorrectGoogleIdIndex =
        googleIdIndex?.unique === true &&
        googleIdIndex?.partialFilterExpression?.googleId?.$type === 'string';

    if (googleIdIndex && !hasCorrectGoogleIdIndex) {
        await User.collection.dropIndex('googleId_1');
        if (process.env.NODE_ENV !== 'deployment') {
            console.log('Dropped old googleId_1 index');
        }
    }

    if (!hasCorrectGoogleIdIndex) {
        await User.collection.createIndex(
            { googleId: 1 },
            {
                name: 'googleId_1',
                unique: true,
                partialFilterExpression: { googleId: { $type: 'string' } },
            }
        );
        if (process.env.NODE_ENV !== 'deployment') {
            console.log('Created partial googleId_1 index');
        }
    }
};

const connectDB = async () => {
    if (!uri) {
        if (process.env.NODE_ENV !== 'deployment') {
            console.warn('Database connection skipped because URI is not set.');
        }
        return;
    }

    try {
        await mongoose.connect(uri);
        await ensureUserIndexes();
        if (process.env.NODE_ENV !== 'deployment') {
            console.log('Database connection success');
        }
    } catch (err) {
        console.error('Database connection error: ' + err.message);
        process.exit(1); 
    }
};

module.exports = connectDB;
