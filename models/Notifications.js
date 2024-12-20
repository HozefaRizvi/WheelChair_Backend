
const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    notificationBody: {
      type: String,
      required: true,
    },
    notificationTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  }, {
    timestamps: true,
  });

  module.exports = mongoose.model('Notification', notificationSchema);
  