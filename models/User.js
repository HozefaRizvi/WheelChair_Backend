// Update the User Schema to include myPhoneNumber

const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  usertype: {
    type: String,
    enum: ['disabled', 'family'],
    default: 'disabled',
    required: true,
  },
  // Fields for 'disabled' type
  disabilityType: {
    type: String,
    required: function () {
      return this.usertype === 'disabled';
    },
  },
  familyPhoneNumber: {
    type: String,
    required: function () {
      return this.usertype === 'disabled';
    },
  },
  currentLocation: {
    longitude: {
      type: Number,
      required: function () {
        return this.usertype === 'disabled';
      },
    },
    latitude: {
      type: Number,
      required: function () {
        return this.usertype === 'disabled';
      },
    },
  },
  // Fields for 'family' type
  disableFamilyPersonPhoneNumber: {
    type: String,
    required: function () {
      return this.usertype === 'family';
    },
  },
  // New myPhoneNumber field
  myPhoneNumber: {
    type: String,
    required: true, // Assuming it's a required field
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
