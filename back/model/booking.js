const mongoose = require('mongoose');

const tentativeDateSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
   isSelectedByUser: {
    type: Boolean,
    default: false
  }
});

const hallBookingSchema = new mongoose.Schema({
  // User Information for My Bookings feature
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  
  // Primary Booking Details
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'Academic Lecture',
      'Student Club Meeting',
      'Conference / Workshop',
      'Examination',
      'Cultural Event',
      'Social Gathering',
      'Private Function',
      'Other'
    ]
  },
  preferredHall: {
    type: String,
    required: true,
    enum: [
      'Auditorium',
      'Euphresia Conference Hall',
      'Christ Conference Hall',
      'Silver Jubilee Seminar Hall',
      'Lissieux Seminar Hall',
      'Marian Hall'
    ]
  },
  backupHall: {
    type: String,
    enum: [
      'Auditorium',
      'Euphresia Conference Hall',
      'Christ Conference Hall',
      'Silver Jubilee Seminar Hall',
      'Lissieux Seminar Hall',
      'Marian Hall',
      ''
    ],
    default: ''
  },
  bookingType: {
    type: String,
    required: true,
    enum: ['single', 'multiple'],
    default: 'single'
  },
  
  // Single date booking fields
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  startTime: {
    type: String
  },
  endTime: {
    type: String
  },
  
  // Multiple dates for tentative booking
  tentativeDates: [tentativeDateSchema],
  needsSetupTime: {
    type: Boolean,
    default: false
  },
  
  // Requester Information
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Event Details
  attendees: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Technical Requirements
  avEquipment: [{
    type: String,
    enum: [
      'Microphone (Lapel)',
      'Microphone (Handheld)',
      'Microphone (Podium)',
      'Projector & Screen',
      'Laptop/PC Connection',
      'Sound System',
      'Video Conferencing',
      'Live Streaming',
      'Whiteboard/Flip Chart'
    ]
  }],
  furniture: [{
    type: String,
    enum: [
      'Podium',
      'Additional Tables',
      'Stage',
      'Special Lighting',
      'Display Boards'
    ]
  }],
  needsInternet: {
    type: Boolean,
    default: false
  },
  
  // Additional Services
  needsSecurity: {
    type: Boolean,
    default: false
  },
  additionalNotes: {
    type: String,
    trim: true,
    default: ''
  },
  
  // System Fields
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  bookingReference: {
    type: String,
    unique: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  confirmedDate: {
    type: Date
  },
  // For multiple/tentative bookings: tracks if a date has been confirmed
  dateConfirmed: {
    type: Boolean,
    default: false
  },
  // Stores the admin-approved tentative date (selected by admin from tentativeDates)
  adminApprovedTentativeDate: {
    type: Date
  },
  // Stores the confirmed tentative date (selected from tentativeDates)
  confirmedTentativeDate: {
    type: Date
  },
  // For multiple/tentative bookings: tracks if a hall has been confirmed
  hallConfirmed: {
    type: Boolean,
    default: false
  },
  // Stores the confirmed hall (selected from preferredHall or backupHall)
  confirmedHall: {
    type: String,
    enum: [
      'Auditorium',
      'Euphresia Conference Hall',
      'Christ Conference Hall',
      'Silver Jubilee Seminar Hall',
      'Lissieux Seminar Hall',
      'Marian Hall',
      ''
    ],
    default: ''
  },
  // In your booking schema, add:
lastWarningSent: {
  type: Date,
  default: null
},
  adminNotes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true,
    strict: false
});

// Generate booking reference before saving
hallBookingSchema.pre('save', async function(next) {
  if (!this.bookingReference) {
    const prefix = 'HALL';
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.bookingReference = `${prefix}${randomNum}`;
  }
  next();
});

// Validation for single date booking
hallBookingSchema.path('startDate').validate(function(value) {
  if (this.bookingType === 'single') {
    return value != null;
  }
  return true;
}, 'Start date is required for single date booking');

// Validation for multiple dates booking
hallBookingSchema.path('tentativeDates').validate(function(value) {
  if (this.bookingType === 'multiple') {
    return value && value.length > 0;
  }
  return true;
}, 'At least one tentative date is required for multiple dates booking');

// Helper method to get the earliest tentative date
hallBookingSchema.methods.getEarliestTentativeDate = function() {
  if (this.bookingType !== 'multiple' || !this.tentativeDates || this.tentativeDates.length === 0) {
    return null;
  }
  const dates = this.tentativeDates.map(td => new Date(td.date));
  return new Date(Math.min(...dates));
};

// Helper method to get the admin-approved tentative date (used for confirmation deadline)
hallBookingSchema.methods.getAdminApprovedDate = function() {
  if (this.bookingType !== 'multiple' || !this.adminApprovedTentativeDate) {
    return null;
  }
  return new Date(this.adminApprovedTentativeDate);
};

// Helper method to check if booking needs confirmation (3 days before event)
hallBookingSchema.methods.needsConfirmation = function() {
  if (this.bookingType !== 'multiple' || this.status !== 'approved' || (this.dateConfirmed && this.hallConfirmed) || this.status === 'cancelled' || this.status === 'rejected') {
    return false;
  }
  // Use admin-approved date if available, otherwise return false (admin must approve first)
  const approvedDate = this.getAdminApprovedDate();
  if (!approvedDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(approvedDate);
  eventDate.setHours(0, 0, 0, 0);
  
  const threeDaysBefore = new Date(eventDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  
  // Needs confirmation if we're at or past the 3-day mark and either date or hall is not confirmed
  return today >= threeDaysBefore && (!this.dateConfirmed || !this.hallConfirmed);
};

// Helper method to check if booking should be auto-cancelled (past the 3-day deadline without confirmation)
hallBookingSchema.methods.shouldBeAutoCancelled = function() {
  if (this.bookingType !== 'multiple' || this.status !== 'approved' || (this.dateConfirmed && this.hallConfirmed) || this.status === 'cancelled' || this.status === 'rejected') {
    return false;
  }
  // Use admin-approved date - user must confirm the admin-approved date
  const approvedDate = this.getAdminApprovedDate();
  if (!approvedDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(approvedDate);
  eventDate.setHours(0, 0, 0, 0);
  
  const threeDaysBefore = new Date(eventDate);
  threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
  
  // If today is past the 3-day deadline and date or hall is not confirmed, should be cancelled
  return today > threeDaysBefore && (!this.dateConfirmed || !this.hallConfirmed);
};

// Helper method to confirm a tentative date
hallBookingSchema.methods.confirmTentativeDate = function(dateIndex, selectedHall) {
  if (this.bookingType !== 'multiple' || !this.tentativeDates || !this.tentativeDates[dateIndex]) {
    throw new Error('Invalid booking or date index');
  }
  
  const selectedDate = this.tentativeDates[dateIndex];
  
  this.confirmedDate = selectedDate.date;
  this.confirmedTentativeDate = selectedDate.date;
  this.startDate = selectedDate.date;
  this.endDate = selectedDate.date;
  this.startTime = selectedDate.startTime;
  this.endTime = selectedDate.endTime;
  this.dateConfirmed = true;
  
  if (selectedHall) {
    this.confirmedHall = selectedHall;
    this.hallConfirmed = true;
  }
  
  return this;
};



const HallBooking = mongoose.model('HallBooking', hallBookingSchema);

module.exports = HallBooking;