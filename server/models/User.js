const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    googleId: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, unique: true },
    picture: { type: String },
    token: { type: String }
});

module.exports = mongoose.model('User', userSchema);
