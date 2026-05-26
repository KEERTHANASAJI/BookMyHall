const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    securityQuestion1: {
    type: String,
    required: true
  },

  securityAnswer1: {
    type: String,
    required: true
  },

  securityQuestion2: {
    type: String,
    required: true
  },

  securityAnswer2: {
    type: String,
    required: true
  }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);