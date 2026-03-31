const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false  // Admin notifications don't need userId
  },

  role: {
    type: String,
    enum: ["user", "admin"],
    required: true  // MUST specify who this notification is for
  },

  title: {
    type: String,
    required: true
  },

  message: {
    type: String,
    required: true
  },

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: false
  },

  isRead: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
