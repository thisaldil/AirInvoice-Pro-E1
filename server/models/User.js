const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  googleId: { type: String, required: true, unique: true },
  token: { type: String }
});

module.exports = mongoose.model('User', userSchema);
