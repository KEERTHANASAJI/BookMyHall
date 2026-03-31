const express = require("express")
require("./connection")
const bookModel = require("./model/booking")
const cors = require('cors')
const User = require('./model/User');
const Notification = require("./model/Notification");

// Initialization
const app = express()

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.send('Hall Booking Backend Running Successfully!');
});
// Add these helper functions after imports
const parseTimeToDate = (dateStr, timeStr) => {
  if (!timeStr) return new Date(dateStr);
  
  const date = new Date(dateStr);
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':');
  
  let hour = parseInt(hours);
  if (period) {
    if (period.toLowerCase() === 'pm' && hour < 12) {
      hour += 12;
    } else if (period.toLowerCase() === 'am' && hour === 12) {
      hour = 0;
    }
  }
  
  date.setHours(hour, parseInt(minutes), 0, 0);
  return date;
};

const checkTimeOverlap = (start1, end1, start2, end2) => {
  return (start1 < end2 && end1 > start2);
};
const isTooLateForTentative = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = (target - today) / (1000 * 60 * 60 * 24);
  return diffDays < 3; // less than 3 days ❌
};

const hasTimeConflict = async ({
  hall,
  date,
  startTime,
  endTime,
  excludeBookingId
}) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Find all bookings for this hall and date
  const bookings = await bookModel.find({
    preferredHall: hall,
    $or: [
      // Single date bookings
      {
        bookingType: 'single',
        startDate: { $gte: targetDate, $lt: nextDay }
      },
      // Multiple date bookings
      {
        bookingType: 'multiple',
        tentativeDates: {
          $elemMatch: {
            date: { $gte: targetDate, $lt: nextDay }
          }
        }
      }
    ]
  });

  for (const booking of bookings) {
    // Skip if this is the booking we're excluding (for updates)
    if (excludeBookingId && booking._id.toString() === excludeBookingId) {
      continue;
    }

    // Skip cancelled bookings
    if (booking.status === 'cancelled') {
      continue;
    }

    // Skip tentative bookings that are not confirmed
    if (booking.status === 'tentative' || (booking.status === 'pending' && !booking.dateConfirmed)) {
      continue;
    }

    // Check if this time slot is in released dates (should be available)
    if (booking.releasedDates && booking.releasedDates.length > 0) {
      const requestedStart = parseTimeToDate(date, startTime);
      const requestedEnd = parseTimeToDate(date, endTime);

      const isReleased = booking.releasedDates.some(r => {
        if (r.hall !== hall) return false;

        const rDate = new Date(r.date);
        if (rDate.toDateString() !== targetDate.toDateString()) return false;

        const releasedStart = parseTimeToDate(r.date, r.startTime);
        const releasedEnd = parseTimeToDate(r.date, r.endTime);

        return checkTimeOverlap(
          releasedStart,
          releasedEnd,
          requestedStart,
          requestedEnd
        );
      });

      if (isReleased) {
        // This time slot is released, so it's available
        continue;
      }
    }

    // Single booking check
    if (booking.bookingType === 'single') {
      const existingStart = parseTimeToDate(booking.startDate, booking.startTime);
      const existingEnd = parseTimeToDate(booking.startDate, booking.endTime);
      const requestedStart = parseTimeToDate(date, startTime);
      const requestedEnd = parseTimeToDate(date, endTime);

      // Only check bookings that are approved or pending with confirmed dates
      if (booking.status === 'approved' || booking.status === 'pending') {
        if (checkTimeOverlap(existingStart, existingEnd, requestedStart, requestedEnd)) {
          return true;
        }
      }
    }

    // Multiple booking check
    if (booking.bookingType === 'multiple') {
      // Skip if not date confirmed
      if (!booking.dateConfirmed) {
        continue;
      }

      // Check tentative dates
      if (booking.tentativeDates && booking.tentativeDates.length > 0) {
        for (const td of booking.tentativeDates) {
          const tdDate = new Date(td.date);
          if (tdDate.toDateString() !== targetDate.toDateString()) continue;

          const existingStart = parseTimeToDate(td.date, td.startTime);
          const existingEnd = parseTimeToDate(td.date, td.endTime);
          const requestedStart = parseTimeToDate(date, startTime);
          const requestedEnd = parseTimeToDate(date, endTime);

          if (checkTimeOverlap(existingStart, existingEnd, requestedStart, requestedEnd)) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

// Login route
app.post("/login", async (req, res) => {
  try {
    var user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.send({ message: "User not found" });
    }
    if (user.password === req.body.password) {
      return res.send({
        message: "Logged in successfully",
        userType: user.userType,
        name: user.name,
        username: user.username,
        userId: user._id
      });
    }
    else {
      return res.send({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    return res.send({ message: "Error occurred during login" });
  }
});

// Signup route
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.send({ message: "Username already exists" });
    }

    const newUser = new User({
      username: username,
      password: password,
      name: username,
      userType: "user"
    });

    await newUser.save();
    return res.send({ message: "User created successfully" });

  } catch (error) {
    console.log(error);
    return res.send({ message: "Error occurred during signup" });
  }
});

// Get bookings for a specific user
app.get('/my-bookings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await bookModel.find({ userId: userId });
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});


// --------------------------------------------------------
// 🔥 UPDATED POST ROUTE — MULTIPLE DATES FIX
// --------------------------------------------------------
app.post('/bookings', async (req, res) => {
  try {
    const {
      userId,
      username,
      eventName,
      eventType,
      preferredHall,
      backupHall,
      bookingType,
      startDate,
      endDate,
      startTime,
      endTime,
      tentativeDates,
      fullName,
      department,
      email,
      phone,
      attendees,
      avEquipment,
      furniture,
      needsInternet,
      needsSecurity,
      additionalNotes,
      isTemporary = false,
      // New fields for released date booking
      isReleasedDateBooking = false,
      originalBookingId = null,
      releasedDateId = null
    } = req.body;
    // 🚫 BLOCK late tentative bookings
if (bookingType === 'multiple' && Array.isArray(tentativeDates)) {

  const invalidDates = tentativeDates.filter(td =>
    isTooLateForTentative(td.date)
  );

  if (invalidDates.length > 0) {

    // 🔔 notify user immediately
    await Notification.create({
      userId,
      role: 'user',
      title: 'Tentative Booking Rejected',
      message: 'Tentative bookings must be confirmed at least 3 days in advance. Selected dates are too close.',
      isRead: false
    });

    return res.status(400).json({
      success: false,
      message: 'Too late to create tentative booking'
    });
  }
}

const hallCapacityRules = {
  "Auditorium": { min: 400, max: 1000 },
  "Euphresia Conference Hall": { min: 10, max: 20 },
  "Christ Conference Hall": { min: 20, max: 30 },
  "Silver Jubilee Seminar Hall": { min: 80, max: 130 },
  "Lissieux Seminar Hall": { min: 100, max: 150 },
  "Marian Hall": { min: 200, max: 350 }
};

const rule = hallCapacityRules[req.body.preferredHall];

if (rule) {
  const attendees = Number(req.body.attendees);

  if (attendees < rule.min || attendees > rule.max) {
    return res.status(400).json({
      message: `Attendees must be between ${rule.min} and ${rule.max} for ${req.body.preferredHall}`
    });
  }
}
// Add this after the hallCapacityRules check in the POST /bookings route
// Prevent creating tentative bookings for events within 3 days
if (isTemporary) {
  let eventDate;
  
  if (bookingType === 'single' && startDate) {
    eventDate = new Date(startDate);
  } else if (bookingType === 'multiple' && formattedTentativeDates.length > 0) {
    // Find the earliest tentative date
    const dates = formattedTentativeDates.map(d => new Date(d.date));
    eventDate = new Date(Math.min(...dates));
  }
  
  if (eventDate) {
    const now = new Date();
    const daysDifference = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < 3) {
      return res.status(400).json({
        message: 'Cannot create tentative booking for events within 3 days. Please create a regular booking or choose a later date.',
        isTemporary: true
      });
    }
  }
}
    // FIX: Always store full array of tentative dates
    const formattedTentativeDates = Array.isArray(tentativeDates)
      ? tentativeDates.map(d => ({
          date: d.date,
          startTime: d.startTime,
          endTime: d.endTime
        }))
      : [];

    // --------------------------------------------------
    // 🔒 CONFLICT CHECK (IMPORTANT)
    // --------------------------------------------------
    let conflict = false;
    
    if (bookingType === 'single') {
      conflict = await hasTimeConflict({
        hall: preferredHall,
        date: startDate,
        startTime,
        endTime
      });

      if (conflict && !isReleasedDateBooking) {
        return res.status(409).json({
          success: false,
          message: "Hall is already booked or tentatively held for this date and time"
        });
      }
    }

    if (bookingType === 'multiple' && Array.isArray(formattedTentativeDates)) {
      for (const td of formattedTentativeDates) {
        conflict = await hasTimeConflict({
          hall: preferredHall,
          date: td.date,
          startTime: td.startTime,
          endTime: td.endTime
        });

        if (conflict) {
          return res.status(409).json({
            success: false,
            message: `Hall is already blocked for ${new Date(td.date).toDateString()} (${td.startTime} - ${td.endTime})`
          });
        }
      }
    }

    // Create booking object
    const bookingData = {
      userId,
      username,
      eventName,
      eventType,
      preferredHall,
      backupHall,
      bookingType,
      startDate,
      endDate,
      startTime,
      endTime,
      tentativeDates: formattedTentativeDates,
      fullName,
      department,
      email,
      phone,
      attendees,
      avEquipment,
      furniture,
      needsInternet,
      needsSecurity,
      additionalNotes,
      isTemporary,
      holdCreatedAt: new Date()
    };

    // If this is a released date booking, mark it as such
    if (isReleasedDateBooking && originalBookingId && releasedDateId) {
      bookingData.isFromReleasedDate = true;
      bookingData.originalReleasedDateInfo = {
        originalBookingId,
        releasedDateId
      };
    }

    // Set status based on whether it's a tentative booking
    if (isTemporary) {
      bookingData.status = 'tentative';
      bookingData.isTemporary = true;
      
      // Calculate tentative expiry (3 days before event)
      let eventDate = null;
      
      if (bookingType === 'single' && startDate) {
        eventDate = new Date(startDate);
      } else if (bookingType === 'multiple' && formattedTentativeDates.length > 0) {
        // Find the earliest tentative date
        const dates = formattedTentativeDates.map(d => new Date(d.date));
        eventDate = new Date(Math.min(...dates));
      }
      
      if (eventDate) {
        // Set expiry to 3 days before the event (at end of day)
        const expiryDate = new Date(eventDate);
        expiryDate.setDate(expiryDate.getDate() - 3);
        expiryDate.setHours(23, 59, 59, 999);
        bookingData.tentativeExpiry = expiryDate;
        bookingData.tentativeEventDate = eventDate;
      }
    } else {
      bookingData.status = 'pending';
      bookingData.isTemporary = false;
    }

    const booking = new bookModel(bookingData);
    await booking.save();
    
    // If this is a released date booking, remove the released date from original booking
    if (isReleasedDateBooking && originalBookingId && releasedDateId) {
      try {
        await bookModel.findByIdAndUpdate(
          originalBookingId,
          {
            $pull: { 
              releasedDates: { 
                _id: releasedDateId,
                hall: preferredHall,
                date: startDate,
                startTime: startTime,
                endTime: endTime
              } 
            }
          }
        );
        
        console.log(`Removed released date ${releasedDateId} from booking ${originalBookingId}`);
      } catch (error) {
        console.error("Error removing released date:", error);
        // Continue even if this fails - the booking is still created
      }
    }
    
    // Determine notification message based on booking type
    let notificationMessage;
    if (isTemporary) {
      notificationMessage = `New tentative booking: ${booking.eventName} (${booking.preferredHall})`;
      
      // Also notify user about their tentative booking
      await Notification.create({
        userId: booking.userId,
        title: "Tentative Booking Created",
        bookingId: booking._id,
        message: `Your tentative booking for ${booking.eventName} has been created. Please confirm before ${booking.tentativeExpiry ? new Date(booking.tentativeExpiry).toLocaleDateString() : '3 days before event'}.`,
        role: "user"
      });
    } else {
      notificationMessage = isReleasedDateBooking
        ? `New booking from released date: ${booking.eventName} (${booking.preferredHall})`
        : `New booking pending approval: ${booking.eventName} (${booking.preferredHall})`;
    }

    // Notify admin
    await Notification.create({
      userId: null,
      title: "New Notification",
      bookingId: booking._id,
      message: notificationMessage,
      role: "admin"
    });

    // Prepare response
    const responseData = {
      message: isTemporary ? 
        'Tentative booking created successfully! You must confirm 3 days before the event.' :
        'Booking saved successfully!',
      bookingReference: booking.bookingReference,
      bookingId: booking._id,
      isTemporary: booking.isTemporary,
      status: booking.status,
      isFromReleasedDate: isReleasedDateBooking || false
    };

    // Add tentative expiry info if it's a temporary booking
    if (isTemporary && booking.tentativeExpiry) {
      const now = new Date();
      const expiry = new Date(booking.tentativeExpiry);
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      responseData.tentativeExpiry = booking.tentativeExpiry;
      responseData.daysRemaining = diffDays > 0 ? diffDays : 0;
      responseData.warning = diffDays <= 3 ? 
        `Urgent: Confirm your booking within ${diffDays} day${diffDays !== 1 ? 's' : ''}` : 
        `Please confirm your booking before ${expiry.toLocaleDateString()}`;
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ 
      message: 'Error saving booking', 
      error: error.message,
      isTemporary: req.body.isTemporary || false
    });
  }
});

// PATCH: Confirm a tentative booking (convert to pending for admin approval)
app.patch('/bookings/:id/confirm-tentative', async (req, res) => {
  try {
    const booking = await bookModel.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    if (booking.status !== 'tentative' || !booking.isTemporary) {
      return res.status(400).json({ 
        success: false, 
        message: "Only tentative bookings can be confirmed" 
      });
    }

    // Check if tentative booking has expired
    if (booking.tentativeExpiry && new Date() > new Date(booking.tentativeExpiry)) {
      return res.status(400).json({ 
        success: false, 
        message: "This tentative booking has expired. Please create a new booking." 
      });
    }

    // Convert tentative booking to pending status
    booking.status = 'pending';
    booking.isTemporary = false;
    booking.tentativeExpiry = null;
    booking.updatedAt = new Date();

    await booking.save();

    // Notify admin that tentative booking is now confirmed
    await Notification.create({
      userId: null,
      title: "Tentative Booking Confirmed",
      bookingId: booking._id,
      message: `User confirmed tentative booking: ${booking.eventName} (${booking.preferredHall})`,
      role: "admin"
    });

    // Notify user
    await Notification.create({
      userId: booking.userId,
      title: "Booking Confirmed",
      bookingId: booking._id,
      message: `Your tentative booking for ${booking.eventName} has been confirmed and submitted for admin approval.`,
      role: "user"
    });

    res.json({ 
      success: true, 
      message: "Tentative booking confirmed and submitted for approval",
      data: booking 
    });

  } catch (error) {
    console.error('Error confirming tentative booking:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// GET: Retrieve all bookings
app.get('/bookings', async (req, res) => {
  try {
    const bookings = await bookModel.find();
    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bookings",
      error: error.message
    });
  }
});

// GET: Retrieve booking by reference number
app.get('/bookings/reference/:reference', async (req, res) => {
  try {
    const booking = await bookModel.findOne({ bookingReference: req.params.reference });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found with this reference number'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking by reference:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
});

// GET: Search bookings
app.get('/bookings/search/:criteria', async (req, res) => {
  try {
    const { criteria } = req.params;
    const { query } = req.query;

    let searchFilter = {};

    switch (criteria) {
      case 'email':
        searchFilter = { email: { $regex: query, $options: 'i' } };
        break;
      case 'collegeId':
        searchFilter = { collegeId: { $regex: query, $options: 'i' } };
        break;
      case 'eventName':
        searchFilter = { eventName: { $regex: query, $options: 'i' } };
        break;
      case 'hall':
        searchFilter = {
          $or: [
            { preferredHall: { $regex: query, $options: 'i' } },
            { backupHall: { $regex: query, $options: 'i' } }
          ]
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid search criteria'
        });
    }

    const bookings = await bookModel.find(searchFilter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching bookings',
      error: error.message
    });
  }
});
// GET: Check if a tentative booking exists for date/time/hall
app.get('/bookings/tentative-check', async (req, res) => {
  try {
    const { hall, date, startTime, endTime } = req.query;

    if (!hall || !date) {
      return res.status(400).json({
        success: false,
        message: 'hall and date are required'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find tentative bookings for this hall and date
    const tentativeBookings = await bookModel.find({
      status: 'tentative',
      isTemporary: true,
      preferredHall: hall,
      $or: [
        // Single date tentative bookings
        {
          bookingType: 'single',
          startDate: { $gte: targetDate, $lt: nextDay }
        },
        // Multiple date tentative bookings
        {
          bookingType: 'multiple',
          'tentativeDates.date': { 
            $elemMatch: { 
              $gte: targetDate, 
              $lt: nextDay 
            }
          }
        }
      ]
    }).select('eventName startDate startTime endTime tentativeDates tentativeExpiry');

    // If checking specific time, filter by time overlap
    let filteredBookings = tentativeBookings;
    if (startTime && endTime) {
      filteredBookings = tentativeBookings.filter(booking => {
        // For single bookings
        if (booking.bookingType === 'single' && booking.startTime && booking.endTime) {
          const bookingStart = parseTimeToDate(booking.startDate, booking.startTime);
          const bookingEnd = parseTimeToDate(booking.startDate, booking.endTime);
          const requestedStart = parseTimeToDate(date, startTime);
          const requestedEnd = parseTimeToDate(date, endTime);
          
          return checkTimeOverlap(bookingStart, bookingEnd, requestedStart, requestedEnd);
        }
        
        // For multiple bookings with tentative dates
        if (booking.bookingType === 'multiple' && booking.tentativeDates) {
          return booking.tentativeDates.some(td => {
            const tdDate = new Date(td.date);
            if (tdDate.toDateString() !== targetDate.toDateString()) return false;
            
            if (td.startTime && td.endTime && startTime && endTime) {
              const tdStart = parseTimeToDate(td.date, td.startTime);
              const tdEnd = parseTimeToDate(td.date, td.endTime);
              const requestedStart = parseTimeToDate(date, startTime);
              const requestedEnd = parseTimeToDate(date, endTime);
              
              return checkTimeOverlap(tdStart, tdEnd, requestedStart, requestedEnd);
            }
            return true;
          });
        }
        
        return true;
      });
    }

    res.json({
      success: true,
      hasTentativeBookings: filteredBookings.length > 0,
      tentativeBookings: filteredBookings.length,
      bookings: filteredBookings.map(b => ({
        eventName: b.eventName,
        startTime: b.startTime,
        endTime: b.endTime,
        tentativeDates: b.tentativeDates,
        expiry: b.tentativeExpiry,
        isExpired: b.tentativeExpiry ? new Date() > new Date(b.tentativeExpiry) : false
      }))
    });

  } catch (error) {
    console.error('Error checking tentative bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking tentative bookings',
      error: error.message
    });
  }
});
// GET: Check for released dates that are now available
// GET: Check for released dates that are now available
app.get('/bookings/released-dates/available', async (req, res) => {
  try {
    const { hall, date, startTime, endTime } = req.query;

    if (!hall || !date) {
      return res.status(400).json({
        success: false,
        message: 'hall and date are required'
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Find bookings that have released dates for this hall and date
    const bookingsWithReleasedDates = await bookModel.find({
      'releasedDates.date': { $gte: targetDate, $lt: nextDay },
      'releasedDates.hall': hall
    });

    let availableDates = [];
    
    for (const booking of bookingsWithReleasedDates) {
      if (!booking.releasedDates || booking.releasedDates.length === 0) continue;
      
      for (const releasedDate of booking.releasedDates) {
        const releasedDateObj = new Date(releasedDate.date);
        if (releasedDateObj.toDateString() !== targetDate.toString()) continue;
        
        if (!releasedDate.hall || releasedDate.hall !== hall) continue;

        // Check time overlap if specific times are provided
        if (startTime && endTime) {
          const releasedStart = parseTimeToDate(releasedDate.date, releasedDate.startTime);
          const releasedEnd = parseTimeToDate(releasedDate.date, releasedDate.endTime);
          const requestedStart = parseTimeToDate(date, startTime);
          const requestedEnd = parseTimeToDate(date, endTime);
          
          if (!checkTimeOverlap(releasedStart, releasedEnd, requestedStart, requestedEnd)) {
            continue; // Times don't overlap
          }
        }

        // Check if this time slot is still available (not booked by others)
        const conflict = await hasTimeConflict({
          hall: hall,
          date: releasedDate.date,
          startTime: releasedDate.startTime,
          endTime: releasedDate.endTime,
          excludeBookingId: booking._id.toString() // Exclude the original booking
        });

        if (!conflict) {
          availableDates.push({
            _id: releasedDate._id,
            originalBookingId: booking._id,
            date: releasedDate.date,
            startTime: releasedDate.startTime,
            endTime: releasedDate.endTime,
            hall: releasedDate.hall,
            releasedAt: releasedDate.releasedAt,
            reason: releasedDate.reason || 'user_confirmation',
            originalEvent: booking.eventName,
            isAvailable: true,
            // Include all necessary info for booking
            originalBookingReference: booking.bookingReference
          });
        }
      }
    }

    // Remove duplicates
    const uniqueDates = Array.from(
      new Map(
        availableDates.map(item => [
          `${item.date}-${item.startTime}-${item.endTime}-${item.hall}`,
          item
        ])
      ).values()
    );

    res.json({
      success: true,
      available: uniqueDates.length > 0,
      availableDates: uniqueDates.sort((a, b) => new Date(a.date) - new Date(b.date)),
      count: uniqueDates.length
    });

  } catch (error) {
    console.error('Error checking released dates:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking released dates',
      error: error.message
    });
  }
});
// GET: Bookings by status
app.get('/bookings/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['pending', 'approved', 'rejected', 'cancelled','completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const bookings = await bookModel.find({ status }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error fetching bookings by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings by status',
      error: error.message
    });
  }
});

// GET: Date range bookings
app.get('/bookings/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const bookings = await bookModel.find({
      $or: [
        {
          bookingType: 'single',
          startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          bookingType: 'multiple',
          'tentativeDates.date': {
            $elemMatch: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        }
      ]
    }).sort({ startDate: 1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error fetching bookings by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings by date range',
      error: error.message
    });
  }
});

// GET: Retrieve booking by ID
app.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await bookModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching booking'
    });
  }
});
// PATCH: Confirm booking date for multiple bookings
app.patch('/bookings/:id/confirm-date', async (req, res) => {
  const { confirmedHall } = req.body;
  const booking = await bookModel.findById(req.params.id);

  if (booking.bookingType !== 'multiple') {
    return res.status(400).json({ message: "Only for multiple bookings" });
  }

  booking.hallConfirmed = true;
  booking.confirmedHall = confirmedHall;
  booking.preferredHall = confirmedHall;

  await booking.save();

  await Notification.create({
    userId: booking.userId,
    bookingId: booking._id,
    message: `Your booking has been confirmed: ${confirmedHall} ✅`
  });

  res.json({ success: true, data: booking });
});

// PATCH: Confirm tentative date selection - CORRECTED VERSION
app.patch('/bookings/:id/confirm-tentative-date', async (req, res) => {
  try {
    const { confirmedDateIndex, selectedHall } = req.body;
    const booking = await bookModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    if (booking.bookingType !== 'multiple') {
      return res.status(400).json({
        success: false,
        message: "Only multiple bookings support tentative date confirmation"
      });
    }

    if (
      confirmedDateIndex === undefined ||
      !booking.tentativeDates ||
      !booking.tentativeDates[confirmedDateIndex]
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid tentative date selection"
      });
    }

    // Get the selected date
    const selectedDate = booking.tentativeDates[confirmedDateIndex];
    
    // Store ALL dates EXCEPT the confirmed one
    const releasedDates = [];
    for (let i = 0; i < booking.tentativeDates.length; i++) {
      if (i !== confirmedDateIndex) {
        releasedDates.push({
          date: booking.tentativeDates[i].date,
          startTime: booking.tentativeDates[i].startTime,
          endTime: booking.tentativeDates[i].endTime,
          hall: booking.preferredHall,
          releasedAt: new Date()
        });
      }
    }

    // Keep only the confirmed date
    booking.tentativeDates = [selectedDate];
    booking.startDate = selectedDate.date;
    booking.endDate = selectedDate.date;
    booking.startTime = selectedDate.startTime;
    booking.endTime = selectedDate.endTime;
    
    if (selectedHall) {
      booking.preferredHall = selectedHall;
    }
    
    booking.dateConfirmed = true;
    booking.status = "pending";
    booking.updatedAt = new Date();

    // Save the booking with only the confirmed date
    await booking.save();

    // Store released dates in database (optional but recommended)
    // You can create a separate collection for released dates
    // or store them in the booking document:
    booking.releasedDates = releasedDates;
    await booking.save();

    // OPTIONAL: Send notification to admin about released dates
    if (releasedDates.length > 0) {
      await Notification.create({
        userId: null,
        role: "admin",
        title: "Dates Released",
        bookingId: booking._id,
        message: `${releasedDates.length} tentative dates have been released for hall ${booking.preferredHall}.`
      });
    }

    res.json({
      success: true,
      message: "Date confirmed successfully",
      confirmedDate: {
        date: selectedDate.date,
        startTime: selectedDate.startTime,
        endTime: selectedDate.endTime,
        hall: booking.preferredHall
      },
      releasedDatesCount: releasedDates.length,
      releasedDates: releasedDates
    });

  } catch (error) {
    console.error("Error confirming tentative date:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm date",
      error: error.message
    });
  }
});

// Helper function to create notifications for released dates
async function createReleasedDateNotifications(datesToRelease, originalBooking) {
  try {
    // Find other users who have bookings for the same hall but as backup
    for (const dateInfo of datesToRelease) {
      const { date, startTime, endTime, hall } = dateInfo;
      
      // Find users who wanted this hall as backup
      const backupUsers = await bookModel.find({
        backupHall: hall,
        status: { $in: ['pending', 'tentative'] },
        $or: [
          {
            bookingType: 'single',
            startDate: date
          },
          {
            bookingType: 'multiple',
            tentativeDates: {
              $elemMatch: {
                date: date,
                startTime: startTime,
                endTime: endTime
              }
            }
          }
        ]
      });

      // Notify each user about the availability
      for (const userBooking of backupUsers) {
        await Notification.create({
          userId: userBooking.userId,
          role: "user",
          title: "Hall Available",
          message: `Hall ${hall} is now available on ${new Date(date).toLocaleDateString()} (${startTime} - ${endTime}) as another user released their tentative hold.`,
          bookingId: userBooking._id
        });
      }

      // Also check for any bookings that were rejected due to conflicts with this hall
      const conflictingRejectedBookings = await bookModel.find({
        preferredHall: hall,
        status: 'rejected',
        adminNotes: { $regex: 'conflict|unavailable', $options: 'i' },
        $or: [
          {
            bookingType: 'single',
            startDate: date
          },
          {
            bookingType: 'multiple',
            tentativeDates: {
              $elemMatch: {
                date: date
              }
            }
          }
        ]
      });

      // Notify users with rejected bookings about new availability
      for (const rejectedBooking of conflictingRejectedBookings) {
        await Notification.create({
          userId: rejectedBooking.userId,
          role: "user",
          title: "Hall Now Available",
          message: `A previously unavailable hall ${hall} is now available on ${new Date(date).toLocaleDateString()}. You may re-submit your booking.`,
          bookingId: rejectedBooking._id
        });
      }
    }
  } catch (error) {
    console.error("Error creating released date notifications:", error);
  }
}

// Function to cleanup expired tentative bookings
// Enhanced function to cleanup expired tentative bookings and auto-cancel within 3 days
async function cleanupExpiredTentativeBookings() {
  try {
    const now = new Date();
    
    // Find all tentative bookings that need to be cancelled
    const tentativeBookings = await bookModel.find({
      status: 'tentative',
      isTemporary: true,
      $or: [
        // 1. Bookings past their expiry date
        { tentativeExpiry: { $lt: now } },
        
        // 2. Bookings where event is within 3 days but not confirmed
        {
          bookingType: 'single',
          startDate: { 
            $lt: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)), // Within 3 days
            $gte: now // But not in the past
          }
        },
        
        // 3. For multiple bookings where any date is within 3 days
        {
          bookingType: 'multiple',
          $or: [
            {
              tentativeDates: {
                $elemMatch: {
                  date: { 
                    $lt: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)), // Within 3 days
                    $gte: now // But not in the past
                  }
                }
              }
            },
            {
              // Also check if admin has approved a date that's within 3 days
              adminApprovedTentativeDate: { 
                $lt: new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000)), // Within 3 days
                $gte: now // But not in the past
              },
              hallConfirmed: false // And not confirmed by user
            }
          ]
        }
      ]
    });

    for (const booking of tentativeBookings) {
      console.log(`Processing tentative booking: ${booking._id} - ${booking.eventName}`);
      
      let cancellationReason = '';
      let datesToRelease = [];
      
      // Check if it's expired by expiry date
      if (booking.tentativeExpiry && new Date() > new Date(booking.tentativeExpiry)) {
        cancellationReason = 'Auto-cancelled: Tentative hold expired';
      } 
      // Check if single booking within 3 days
      else if (booking.bookingType === 'single' && booking.startDate) {
        const eventDate = new Date(booking.startDate);
        const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilEvent < 3 && daysUntilEvent >= 0) {
          cancellationReason = `Auto-cancelled: Not confirmed within 3 days of event (${daysUntilEvent} day(s) remaining)`;
          
          datesToRelease.push({
            date: booking.startDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            hall: booking.preferredHall,
            originalBookingId: booking._id,
            reason: 'auto_cancelled_3_day_rule',
            releasedAt: new Date()
          });
        }
      } 
      // Check if multiple booking has dates within 3 days
      else if (booking.bookingType === 'multiple') {
        // Check admin approved date
        if (booking.adminApprovedTentativeDate && !booking.hallConfirmed) {
          const approvedDate = new Date(booking.adminApprovedTentativeDate);
          const daysUntilEvent = Math.ceil((approvedDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilEvent < 3 && daysUntilEvent >= 0) {
            cancellationReason = `Auto-cancelled: User did not confirm hall selection within 3 days of admin-approved date (${daysUntilEvent} day(s) remaining)`;
            
            datesToRelease.push({
              date: approvedDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              hall: booking.preferredHall,
              originalBookingId: booking._id,
              reason: 'auto_cancelled_no_hall_confirmation',
              releasedAt: new Date()
            });
          }
        }
        
        // Check tentative dates
        if (booking.tentativeDates && booking.tentativeDates.length > 0) {
          const upcomingDates = booking.tentativeDates.filter(td => {
            const eventDate = new Date(td.date);
            const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
            return daysUntilEvent < 3 && daysUntilEvent >= 0;
          });
          
          if (upcomingDates.length > 0) {
            cancellationReason = `Auto-cancelled: Not confirmed within 3 days of upcoming event dates`;
            
            // Add upcoming dates to release list
            upcomingDates.forEach(td => {
              datesToRelease.push({
                date: td.date,
                startTime: td.startTime,
                endTime: td.endTime,
                hall: booking.preferredHall,
                originalBookingId: booking._id,
                reason: 'auto_cancelled_3_day_rule',
                releasedAt: new Date()
              });
            });
          }
        }
      }
      
      // If we have a cancellation reason, proceed with cancellation
      if (cancellationReason) {
        console.log(`Auto-cancelling: ${cancellationReason}`);
        
        // Create notifications for released dates
        if (datesToRelease.length > 0) {
          await createReleasedDateNotifications(datesToRelease, booking);
          
          // Update booking with released dates
          booking.releasedDates = (booking.releasedDates || []).concat(datesToRelease);
        }
        
        // Notify user about auto-cancellation
       await Notification.create({
  userId: booking.userId,
  role: "user",
  title: "Tentative Booking Auto-Cancelled",
  message: `Your tentative booking for ${booking.eventName} was auto-cancelled. ${cancellationReason}`,
  bookingId: booking._id,
  isRead: false
});

        
        // Notify admin
        await Notification.create({
          userId: null,
          role: "admin",
          title: "Tentative Booking Auto-Cancelled",
          message: `Tentative booking auto-cancelled: ${booking.eventName} (${booking.preferredHall}) - ${cancellationReason}`,
          bookingId: booking._id,
          isRead: false
        });

        // Update booking status to cancelled
       booking.status = 'cancelled';
booking.cancelledAt = new Date();

// 🔥 CRITICAL CLEANUP
booking.tentativeDates = [];
booking.tentativeExpiry = null;
booking.isTemporary = false;
booking.dateConfirmed = false;
booking.hallConfirmed = false;
booking.adminApprovedTentativeDate = null;

await booking.save();
// 🔔 NOW notify user
await Notification.create({
  userId: booking.userId,
  role: "user",
  title: "Tentative Booking Auto-Cancelled",
  message: `Your tentative booking for ${booking.eventName} was auto-cancelled because it was not confirmed within the required time.`,
  bookingId: booking._id,
  isRead: false
});
        
        console.log(`Successfully auto-cancelled booking ${booking._id}`);
      }
    }

    if (tentativeBookings.length > 0) {
      console.log(`Processed ${tentativeBookings.length} tentative bookings for auto-cancellation check`);
    }
  } catch (error) {
    console.error("Error in cleanupExpiredTentativeBookings:", error);
  }
}

// Function to send warnings for bookings approaching 3-day deadline
// Function to send warnings for bookings approaching 3-day deadline
async function sendThreeDayWarningNotifications() {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    // Find tentative bookings with events within 3 days (2-3 days range)
    const warningBookings = await bookModel.find({
      status: 'tentative',
      isTemporary: true,
      $or: [
        {
          bookingType: 'single',
          startDate: { 
            $gte: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)), // 2+ days
            $lt: threeDaysFromNow // Less than 3 days
          }
        },
        {
          bookingType: 'multiple',
          tentativeDates: {
            $elemMatch: {
              date: { 
                $gte: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)), // 2+ days
                $lt: threeDaysFromNow // Less than 3 days
              }
            }
          }
        }
      ]
    });

    for (const booking of warningBookings) {
      // Calculate days remaining
      let daysRemaining = 3;
      let eventDate;
      
      if (booking.bookingType === 'single' && booking.startDate) {
        eventDate = new Date(booking.startDate);
      } else if (booking.bookingType === 'multiple' && booking.tentativeDates && booking.tentativeDates.length > 0) {
        // Get the earliest date
        const dates = booking.tentativeDates.map(td => new Date(td.date));
        eventDate = new Date(Math.min(...dates));
      }
      
      if (eventDate) {
        daysRemaining = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
        
        // Only send warning if 2-3 days remaining
        if (daysRemaining >= 2 && daysRemaining <= 3) {
          // Check if warning was already sent today
          const today = new Date().toDateString();
          const lastWarningSent = booking.lastWarningSent ? new Date(booking.lastWarningSent).toDateString() : null;
          
          if (lastWarningSent !== today) {
            // Send warning notification to user
            await Notification.create({
              userId: booking.userId,
              role: "user",
              title: "URGENT: Confirm Your Booking",
              message: `Your tentative booking for ${booking.eventName} is only ${daysRemaining} day(s) away! Please confirm immediately or it will be auto-cancelled.`,
              bookingId: booking._id
            });
            
            // Update last warning sent timestamp
            booking.lastWarningSent = new Date();
            await booking.save();
            
            console.log(`Sent 3-day warning for booking ${booking._id} (${daysRemaining} days remaining)`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in sendThreeDayWarningNotifications:", error);
  }
}
// Run cleanup every hour
setInterval(cleanupExpiredTentativeBookings, 60 * 60 * 1000); // Every hour

/// Run warning notifications every 6 hours
setInterval(sendThreeDayWarningNotifications, 3 * 60 * 60 * 1000); // Every 6 hours

// Also run on startup
cleanupExpiredTentativeBookings();
sendThreeDayWarningNotifications();

// GET: Multiple bookings needing date confirmation
app.get('/bookings/need-confirmation', async (req, res) => {
  const bookings = await bookModel.find({
    bookingType: 'multiple',
    status: 'approved',
    dateConfirmed: true,
    hallConfirmed: { $ne: true }
  });

  res.json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

// PATCH: Update booking status
// PATCH: Update booking status + Create Notification
// PATCH: Update booking status
app.patch("/bookings/:id/status", async (req, res) => {
  try {
    console.log("PATCH /bookings/:id/status called");
    console.log("Params:", req.params);
    console.log("Body:", req.body);

    const { status, adminNotes } = req.body;

    // Add validation
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: "Status is required" 
      });
    }

    const booking = await bookModel.findById(req.params.id);
    console.log("Found booking:", booking ? "Yes" : "No");
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    console.log("Current booking status:", booking.status);
    console.log("Updating to status:", status);

    // Update status
    booking.status = status;
    booking.adminNotes = adminNotes || "";
    booking.updatedAt = new Date();

    if (status === "approved") {
      booking.confirmedAt = new Date();
    }
    if (status === "rejected") {
      booking.confirmedAt = null;
    }
    if (status === "cancelled") {
      booking.cancelledAt = new Date();
    }

    console.log("Saving booking...");
    await booking.save();
    console.log("Booking saved successfully");

    // Create notification
    const notificationMessage =
      status === "approved"
        ? "Your hall booking has been approved 🎉"
        : status === "rejected"
        ? "Your hall booking has been rejected ❌"
        : null;

    if (notificationMessage) {
      console.log("Creating notification...");
      try {
        await Notification.create({
          userId: booking.userId,
          bookingId: booking._id,
          message: notificationMessage,
          role: "user",
          title: "Booking Update"
        });
        console.log("Notification created successfully");
      } catch (notifError) {
        console.error("Error creating notification:", notifError);
        // Don't fail the whole request if notification fails
      }
    }

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: booking
    });

  } catch (err) {
    console.error("❌ ERROR in PATCH /bookings/:id/status:");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Full error:", err);
    
    res.status(500).json({ 
      success: false, 
      error: err.message,
      details: "Check server logs for more info"
    });
  }
});

    
   


// PUT: Update entire booking
app.put('/bookings/:id', async (req, res) => {
  try {
    const booking = await bookModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking',
      error: error.message
    });
  }
});

// DELETE: Cancel booking
app.delete('/bookings/:id', async (req, res) => {
  try {
    console.log("DELETE /bookings/:id called");
    console.log("Booking ID:", req.params.id);

    const booking = await bookModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    console.log("Booking found:", booking.eventName);
    console.log("Current status:", booking.status);

    if (booking.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected bookings cannot be cancelled"
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled"
      });
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    
    console.log("Saving cancelled booking...");
    await booking.save();
    console.log("Booking cancelled successfully");

    // 🔔 Notify ADMIN about cancellation
    try {
      await Notification.create({
        userId: null,
        title: "Booking Cancelled",
        bookingId: booking._id,
        message: `Booking cancelled by user: ${booking.eventName} (${booking.preferredHall})`,
        role: "admin"
      });
      console.log("Admin notification created");
    } catch (notifError) {
      console.error("Error creating admin notification:", notifError);
    }

    // Find backup users
    console.log("Looking for backup users...");
    const backupUsers = await bookModel.find({
      backupHall: booking.preferredHall,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime,
      endTime: booking.endTime
    });

    console.log("Found backup users:", backupUsers.length);

    // Notify backup users
    for (const backup of backupUsers) {
      try {
        await Notification.create({
          userId: backup.userId,   
          bookingId: booking._id,
          message: `${booking.preferredHall} is now available for your selected time.`,
          role: "user",
          title: "Hall Available"
        });
      } catch (notifError) {
        console.error("Error creating backup user notification:", notifError);
      }
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      updatedBooking: booking
    });

  } catch (error) {
    console.error("❌ ERROR in DELETE /bookings/:id:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    
    res.status(500).json({
      success: false,
      message: "Error cancelling booking",
      error: error.message
    });
  }
});

app.get("/notifications/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
      role: "user",
      isRead: false   // 👈 show only unread notifications
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

// Mark notifications as read
app.patch("/notifications/mark-read/:userId", async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId,role:"user", },
      { $set: { isRead: true } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// ✅ USER: Mark ALL notifications as read (button click)
app.patch("/notifications/mark-all-read/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.updateMany(
      {
        userId: userId,
        role: "user",
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    res.json({
      success: true,
      message: "All user notifications marked as read"
    });

  } catch (error) {
    console.error("Error marking all user notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read"
    });
  }
});
// ✅ ADMIN: Mark all notifications as read
app.patch("/admin/notifications/mark-read", async (req, res) => {
  try {
    await Notification.updateMany(
      { role: "admin", isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: "All admin notifications marked as read" });
  } catch (err) {
    console.error("Admin mark-read error:", err);
    res.status(500).json({ error: "Failed to mark admin notifications as read" });
  }
});

// Hall availability
app.get('/availability', async (req, res) => {
  try {
    const { hall, date, startTime, endTime, excludeBookingId } = req.query;

    if (!hall || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'hall, date, startTime, and endTime are required'
      });
    }

    let conflictFilter = {
      preferredHall: hall,
      status: { $in: ['approved', 'pending'] },
    $or: [
  // ✅ SINGLE bookings (with time overlap)
  {
    bookingType: 'single',
    startDate: { $lte: new Date(date) },
    endDate: { $gte: new Date(date) },
    $and: [
      {
        $or: [
          {
            $and: [
              { startTime: { $lte: startTime } },
              { endTime: { $gte: startTime } }
            ]
          },
          {
            $and: [
              { startTime: { $lte: endTime } },
              { endTime: { $gte: endTime } }
            ]
          },
          {
            $and: [
              { startTime: { $gte: startTime } },
              { endTime: { $lte: endTime } }
            ]}]
      }
    ]
  },

  // ✅ MULTIPLE bookings (ONLY confirmed ones)
  {
    bookingType: 'multiple',
    dateConfirmed: true,
    tentativeDates: {
      $elemMatch: {
        date: new Date(date),
        $or: [
          {
            $and: [
              { startTime: { $lte: startTime } },
              { endTime: { $gte: startTime } }
            ]
          },
          {
            $and: [
              { startTime: { $lte: endTime } },
              { endTime: { $gte: endTime } }
            ]
          },
          {
            $and: [
              { startTime: { $gte: startTime } },
              { endTime: { $lte: endTime } }
            ]
          }
        ]
      }
    }
  }
]
    };

    if (excludeBookingId) {
      conflictFilter._id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await bookModel.find(conflictFilter);

    const isAvailable = conflictingBookings.length === 0;

    res.json({
      success: true,
      available: isAvailable,
      conflictingBookings: conflictingBookings.length,
      conflicts: conflictingBookings.map(booking => ({
        eventName: booking.eventName,
        date: booking.startDate,
        time: `${booking.startTime} - ${booking.endTime}`,
        status: booking.status
      }))
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
});
// Add this route to index.js (after the existing /availability endpoint)
app.get('/availability/tentative-check', async (req, res) => {
  try {
    const { hall, date, startTime, endTime, excludeBookingId } = req.query;

    if (!hall || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'hall, date, startTime, and endTime are required'
      });
    }

    // Check for conflicting tentative bookings
    const tentativeBookings = await bookModel.find({
      status: 'tentative',
      isTemporary: true,
      $or: [
        {
          bookingType: 'single',
          startDate: new Date(date),
          preferredHall: hall,
          $expr: {
            $or: [
              {
                $and: [
                  { $lte: [{ $dateFromString: { dateString: { $concat: [{ $dateToString: { format: "%Y-%m-%d", date: "$startDate" } }, "T", "$startTime", ":00" ] } } }, parseTimeToDate(date, endTime)] },
                  { $gte: [{ $dateFromString: { dateString: { $concat: [{ $dateToString: { format: "%Y-%m-%d", date: "$startDate" } }, "T", "$endTime", ":00" ] } } }, parseTimeToDate(date, startTime)] }
                ]
              }
            ]
          }
        },
        {
          bookingType: 'multiple',
          dateConfirmed: true,
          preferredHall: hall,
          tentativeDates: {
            $elemMatch: {
              date: new Date(date),
              $expr: {
                $or: [
                  {
                    $and: [
                      { $lte: ["$startDateTime", parseTimeToDate(date, endTime)] },
                      { $gte: ["$endDateTime", parseTimeToDate(date, startTime)] }
                    ]
                  }
                ]
              }
            }
          }
        }
      ]
    });

    res.json({
      success: true,
      hasTentativeConflicts: tentativeBookings.length > 0,
      tentativeConflicts: tentativeBookings.length,
      conflictingBookings: tentativeBookings.map(b => ({
        eventName: b.eventName,
        date: date,
        time: `${startTime} - ${endTime}`,
        status: b.status,
        expiry: b.tentativeExpiry
      }))
    });
  } catch (error) {
    console.error('Error checking tentative availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
});
// GET admin notifications (role-based)
app.get("/admin/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({
      role: "admin",
      isRead: false
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching admin notifications" });
  }
});


// Dashboard statistics
// Updated dashboard/stats endpoint
app.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Get all bookings
    const allBookings = await bookModel.find({});
    
    let completedCount = 0;
    let approvedCount = 0;
    
    // Calculate completed vs approved
    allBookings.forEach(booking => {
      if (booking.status === 'completed') {
        completedCount++;
      } else if (booking.status === 'approved') {
        if (booking.startDate) {
          const eventDate = new Date(booking.startDate);
          eventDate.setHours(0, 0, 0, 0);
          
          if (eventDate < today) {
            // Past approved booking - count as completed
            completedCount++;
          } else {
            // Future approved booking - count as approved
            approvedCount++;
          }
        } else {
          // No date - count as approved
          approvedCount++;
        }
      }
    });

    const stats = {
      totalBookings: allBookings.length,
      pendingBookings: await bookModel.countDocuments({ status: 'pending' }),
      approvedBookings: approvedCount,
      // rejectedBookings: await bookModel.countDocuments({ status: 'rejected' }),
       cancelledBookings : await bookModel.countDocuments({
  status: { $in: ['cancelled', 'rejected'] }}),
      completedBookings: completedCount
    };

    // Keep your existing popularHalls and monthlyStats code...
    const popularHalls = await bookModel.aggregate([
      { $group: { _id: '$preferredHall', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const monthlyStats = await bookModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);

    res.json({
      success: true,
      data: {
        ...stats,
        popularHalls,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});
// POST: /admin/update-status/:id
// Replace the first /admin/update-status/:id route (around line 279) with this:
app.post("/admin/update-status/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status, adminNotes, approvedTentativeDate } = req.body;

    // ✅ Combined valid statuses
    const validStatuses = ['approved', 'rejected', 'pending', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const booking = await bookModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // =====================================================
    // 🔥 MULTIPLE / TENTATIVE BOOKING APPROVAL LOGIC (SAFE)
    // =====================================================
    if (status === "approved" && booking.bookingType === 'multiple') {
      if (!approvedTentativeDate) {
        return res.status(400).json({
          success: false,
          message: "Please select a tentative date to approve for multiple bookings"
        });
      }

      if (!booking.tentativeDates || booking.tentativeDates.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No tentative dates found in this booking"
        });
      }

      const approvedDateObj = new Date(approvedTentativeDate);
      const tentativeDateFound = booking.tentativeDates.find(td => {
        return new Date(td.date).toDateString() === approvedDateObj.toDateString();
      });
      // -----------------------------------------------------
// 🔒 CONFLICT CHECK — VERY IMPORTANT
// -----------------------------------------------------
const conflict = await hasTimeConflict({
  hall: booking.preferredHall,
  date: approvedDateObj,
  startTime: tentativeDateFound.startTime,
  endTime: tentativeDateFound.endTime
});

if (conflict) {
  return res.status(409).json({
    success: false,
    message: "Cannot approve. Another booking already occupies this hall at the selected date and time."
  });
}

      if (!tentativeDateFound) {
        return res.status(400).json({
          success: false,
          message: "Approved date must be one of the tentative dates"
        });
      }

      // ✅ Save admin-approved date
      booking.adminApprovedTentativeDate = approvedDateObj;
      booking.dateConfirmed = true;
      booking.confirmedTentativeDate = approvedDateObj;
      booking.confirmedDate = approvedDateObj;

      booking.startDate = approvedDateObj;
      booking.endDate = approvedDateObj;
      booking.startTime = tentativeDateFound.startTime;
      booking.endTime = tentativeDateFound.endTime;

      // 🔔 User must still confirm hall
      booking.hallConfirmed = false;
    }

    // =====================================================
    // 🔄 COMMON STATUS UPDATE LOGIC
    // =====================================================
    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    booking.updatedAt = new Date();

    if (status === "approved") {
      booking.confirmedAt = new Date();
    } else if (status === "cancelled") {
      booking.cancelledAt = new Date();
    } else if (status === "completed") {
      booking.completedAt = new Date();
    } else if (status === "rejected") {
      booking.confirmedAt = null;
      booking.adminApprovedTentativeDate = null;
    }

    const savedBooking = await booking.save();

    // =====================================================
    // 🔔 USER NOTIFICATION (COMBINED)
    // =====================================================
    let notificationMessage;
    switch (status) {
      case "approved":
        if (booking.bookingType === 'multiple' && booking.adminApprovedTentativeDate) {
          const approvedDate = new Date(booking.adminApprovedTentativeDate);
          const deadline = new Date(approvedDate);
          deadline.setDate(deadline.getDate() - 3);

          notificationMessage =
            `Your hall booking has been approved 🎉 ` +
            `Admin confirmed ${approvedDate.toLocaleDateString()} as your event date. ` +
            `Please confirm your hall before ${deadline.toLocaleDateString()}.`;
        } else {
          notificationMessage = "Your hall booking has been approved 🎉";
        }
        break;

      case "rejected":
        notificationMessage = "Your hall booking has been rejected ❌";
        break;

      case "cancelled":
        notificationMessage = "Your hall booking has been cancelled";
        break;

      case "completed":
        notificationMessage = "Your hall booking has been completed ✅";
        break;

      default:
        notificationMessage = `Your booking status has been updated to ${status}`;
    }

    await Notification.create({
      userId: booking.userId,
      bookingId: bookingId,
      message: notificationMessage,
      role: "user",
      title: "Booking Status Updated"
    });

    // =====================================================
    // ✅ RESPONSE
    // =====================================================
    res.json({
      success: true,
      message: "Booking status updated successfully",
      data: savedBooking,
      approvedDateDetails:
        booking.bookingType === 'multiple' && booking.adminApprovedTentativeDate
          ? {
              adminApprovedTentativeDate: booking.adminApprovedTentativeDate,
              dateConfirmed: booking.dateConfirmed,
              startDate: booking.startDate,
              endDate: booking.endDate,
              startTime: booking.startTime,
              endTime: booking.endTime,
              hallConfirmed: booking.hallConfirmed
            }
          : null,
      notification: notificationMessage
    });

  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update status",
      details: error.message
    });
  }
});


// Port setting
app.listen(3000, () => {
  console.log("Server is running on port 3000")
});
