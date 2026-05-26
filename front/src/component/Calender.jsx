import React, { useState, useEffect } from 'react';
import './Calender.css';
import { Link } from 'react-router-dom';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [hallAvailability, setHallAvailability] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock data for hall availability
const mockHalls = [
     { 
      id: 1, 
      name: "Auditorium", 
      capacity: 1000, 
      image: "https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud1.jpg",
    },
    { 
      id: 2, 
      name: "Euphresia Conference Hall", 
      capacity: 20, 
      image: "https://vimalacollege.edu.in/ssr2021/images/seminar/ech/001.jpg",
    },
    { 
      id: 3, 
      name: "Silver Jubilee Seminar Hall", 
      capacity: 130, 
      image: "https://vimalacollege.edu.in/ssr2021/images/seminar/sjsh/stage.jpg",
    },
    { 
      id: 4, 
      name: "Lissieux Seminar Hall", 
      capacity: 150, 
      image: "https://vimalacollege.edu.in/ssr2021/images/seminar/lsh/stage.jpg",
    },
    { 
      id: 5, 
      name: "Marian Hall", 
      capacity: 350, 
      image: "https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/stage.jpg",
    },
    { 
      id: 6, 
      name: "Christ Conference Hall", 
      capacity: 30, 
      image: "https://vimalacollege.edu.in/ssr2021/images/seminar/cch/001.jpg",
    }
  ];

  // Fetch bookings from API
  useEffect(() => {
    fetchBookings();
  }, []);
useEffect(() => {
  const interval = setInterval(() => {
    fetchBookings();
  }, 30000); // every 30 seconds

  return () => clearInterval(interval);
}, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setBookings(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };
const activeBookings = bookings.filter(
  b => b.status !== 'cancelled'
);

  // NEW: Get all bookings for a specific date and hall (including tentative)
  const getBookingsForDateAndHall = (date, hallName) => {
    if (!activeBookings || activeBookings.length === 0) return [];
    
    const targetDate = date.toDateString();
    
    return activeBookings.filter(booking => {
      // For continuous/single booking type
if (booking.bookingType === 'single' && booking.startDate) {

  const startDate = new Date(booking.startDate);
  const endDate = booking.endDate
    ? new Date(booking.endDate)
    : new Date(booking.startDate);

  // remove time part
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);

  const matchesHall = booking.preferredHall === hallName;

  // check whether selected date is between start and end
  const matchesDate =
    currentDate >= startDate &&
    currentDate <= endDate;

  return (
    matchesHall &&
    matchesDate &&
    (booking.status === 'approved' || booking.status === 'pending')
  );
}
      
      // For multiple/tentative booking type
      if (
  booking.bookingType === 'multiple' &&
  Array.isArray(booking.tentativeDates) &&
  booking.tentativeDates.length > 0
) {

        // Check if any tentative date matches the target date
        const hasMatchingTentativeDate = booking.tentativeDates.some(tentativeDate => {
          const tentativeDateStr = new Date(tentativeDate.date).toDateString();
          return tentativeDateStr === targetDate;
        });
        
        const matchesHall = booking.preferredHall === hallName;
        
        // Include both pending and approved tentative bookings
        return matchesHall && hasMatchingTentativeDate && 
               (booking.status === 'approved' || booking.status === 'pending');
      }
      
      return false;
    });
  };

  // Check if a hall has any bookings for the selected date
  const getHallBookingStatus = (hall, date) => {
    const hallBookings = getBookingsForDateAndHall(date, hall.name);
    const confirmedBookings = hallBookings.filter(b => b.status === 'approved');
    const tentativeBookings = hallBookings.filter(b => b.status === 'pending' && b.bookingType === 'multiple');
    
    const hasConfirmedBookings = confirmedBookings.length > 0;
    const hasTentativeBookings = tentativeBookings.length > 0;
    
    return {
      hasBookings: hasConfirmedBookings || hasTentativeBookings,
      hasConfirmedBookings,
      hasTentativeBookings,
      confirmedBookings,
      tentativeBookings,
      bookingCount: hallBookings.length,
      status: hasConfirmedBookings ? 'booked' : hasTentativeBookings ? 'tentative' : 'available'
    };
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    // Update all halls with their booking status for the selected date
    const updatedHalls = mockHalls.map(hall => {
      const bookingStatus = getHallBookingStatus(hall, clickedDate);
      return {
        ...hall,
        ...bookingStatus
      };
    });
    
    setHallAvailability(updatedHalls);
    setShowAvailability(true);
    setSelectedHall(null);
  };

  // Render calendar days with booking indicators
  const renderDays = () => {
    const totalDays = daysInMonth(currentDate.getMonth(), currentDate.getFullYear());
    const startingDay = firstDayOfMonth();
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === currentDate.getMonth() && 
        selectedDate.getFullYear() === currentDate.getFullYear();

      const isToday = new Date().getDate() === day && 
        new Date().getMonth() === currentDate.getMonth() && 
        new Date().getFullYear() === currentDate.getFullYear();

      // Count bookings for this date
      let confirmedCount = 0;
      let tentativeCount = 0;
      
      mockHalls.forEach(hall => {
        const bookingsForHall = getBookingsForDateAndHall(date, hall.name);
        bookingsForHall.forEach(booking => {
          if (booking.status === 'approved') {
            confirmedCount++;
          } else if (booking.status === 'pending' && booking.bookingType === 'multiple') {
            tentativeCount++;
          }
        });
      });

      days.push(
        <div 
          key={`day-${day}`} 
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
          {isToday && <div className="today-indicator"></div>}
          
          {/* Booking indicators */}
          {(confirmedCount > 0 || tentativeCount > 0) && (
  <div className="booking-indicators">
    {confirmedCount > 0 && (
      <div 
        className="booking-dot confirmed-dot" 
        title={`${confirmedCount} confirmed booking(s)`}
      />
    )}
    {tentativeCount > 0 && (
      <div 
        className="booking-dot tentative-dot" 
        title={`${tentativeCount} tentative booking(s)`}
      />
    )}
  </div>
)}
        </div>
      );
    }

    return days;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleHallSelect = (hall) => {
    setSelectedHall(hall);
  };

  const handleBackToHalls = () => {
    setSelectedHall(null);
  };

  return (
    <div className="calendar-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>BookMyHall</h2>
        </div>
        <Link to="/home"><a className="nav-link">Home</a></Link>
      </nav>

      <div className="calendar-wrapper">
        <div className="calendar">
          <div className="calendar-header">
            <button className="nav-button" onClick={prevMonth}>
              <span className="arrow">&lt;</span>
            </button>
            <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
            <button className="nav-button" onClick={nextMonth}>
              <span className="arrow">&gt;</span>
            </button>
          </div>
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {renderDays()}
          </div>
        </div>
      </div>

      {showAvailability && (
        <div className="availability-overlay">
          <div className="availability-modal">
            <div className="modal-content">
              {!selectedHall ? (
                <>
                  <div className="modal-header">
                    <button 
                      className="back-button" 
                      onClick={() => setShowAvailability(false)}
                    >
                      &larr; Back
                    </button>
                    <h3>Hall Availability for {formatDate(selectedDate)}</h3>
                    <button 
                      className="close-button" 
                      onClick={() => setShowAvailability(false)}
                    >
                      &times;
                    </button>
                  </div>
                  <div className="hall-list">
                    {hallAvailability.map(hall => (
                      <div 
                        key={hall.id} 
                        className={`hall-card ${hall.status === 'booked' ? 'has-bookings' : hall.status === 'tentative' ? 'has-tentative' : 'available'}`}
                        onClick={() => handleHallSelect(hall)}
                      >
                        <div className="hall-image" style={{ backgroundImage: `url(${hall.image})` }}></div>
                        <div className="hall-details">
                          <h4>{hall.name}</h4>
                          <p>Capacity: {hall.capacity} people</p>
                          <div className="availability-status">
                            {hall.status === 'booked' ? (
                              <span className="booked">
                                {hall.confirmedBookings.length} confirmed booking{hall.confirmedBookings.length !== 1 ? 's' : ''}
                              </span>
                            ) : hall.status === 'tentative' ? (
                              <span className="tentative">
                                {hall.tentativeBookings.length} tentative booking{hall.tentativeBookings.length !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="available">Available</span>
                            )}
                          </div>
                          
                          {/* Show tentative bookings preview */}
                          {hall.tentativeBookings.length > 0 && (
                            <div className="tentative-preview">
                              <small>
                                <strong>Tentative Bookings:</strong>
                                {hall.tentativeBookings.slice(0, 2).map(booking => (
                                  <div key={booking._id} className="tentative-preview-item">
                                    • {booking.eventName} (Pending)
                                  </div>
                                ))}
                                {hall.tentativeBookings.length > 2 && (
                                  <div className="bbooking-preview-more">
                                    +{hall.tentativeBookings.length - 2} more...
                                  </div>
                                )}
                              </small>
                            </div>
                          )}
                          
                          {/* Show confirmed bookings preview */}
                          {hall.confirmedBookings.length > 0 && (
                            <div className="bbooking-preview">
                              <small>
                                <strong>Confirmed Bookings:</strong>
                                {hall.confirmedBookings.slice(0, 2).map(booking => (
                                  <div key={booking._id} className="booking-preview-item">
                                    • {booking.eventName}
                                  </div>
                                ))}
                                {hall.confirmedBookings.length > 2 && (
                                  <div className="bbooking-preview-more">
                                    +{hall.confirmedBookings.length - 2} more...
                                  </div>
                                )}
                              </small>
                            </div>
                          )}
                        </div>
                        <div className="view-slots">
                          View details &rarr;
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                 
{/* Modern Elegant Modal Design for Hall Details */}
<div className="mmodern-modal-overlay" style={{ position: 'relative', background: 'transparent', backdropFilter: 'none' }}>
  <div className="mmodern-modal-container" style={{ width: '100%', maxWidth: '1100px' }}>
    <div className="mmodern-modal-header">
      <button className="mmodern-back-btn" onClick={handleBackToHalls}>
        <span>←</span> Back to Halls
      </button>
      <div className="mmodern-modal-title-section">
        <h3>{selectedHall.name}</h3>
        <div className="mmodern-modal-date">
          <span>📅</span> {formatDate(selectedDate)}
        </div>
      </div>
      <button className="mmodern-close-btn" onClick={() => setShowAvailability(false)}>
        ✕
      </button>
    </div>

    <div className="mmodern-modal-body">
      {/* Left Column - Hall Preview Card */}
      <div className="mmodern-hall-preview-card">
        <div className="mmodern-hall-image" style={{ backgroundImage: `url(${selectedHall.image})` }}></div>
        <div className="mmodern-hall-info">
          <div className="mmodern-hall-name">{selectedHall.name}</div>
          <div className="mmodern-hall-meta">
            <span className="mmodern-capacity-badge">👥 Capacity: {selectedHall.capacity} people</span>
            <span className="mmodern-status-indicator">
              <span className="mmodern-status-dot"></span> Active Hall
            </span>
          </div>
        </div>
      </div>

      {/* Right Column - Bookings Container */}
      <div className="mmodern-bookings-container">
        {/* Confirmed Bookings Section */}
        {selectedHall.confirmedBookings && selectedHall.confirmedBookings.length > 0 && (
          <div className="bbooking-section">
            <div className="mmodern-section-header mmodern-confirmed-header">
              <span className="mmodern-section-icon">✅</span>
              <h4>Confirmed Bookings</h4>
              <span className="mmodern-booking-count">{selectedHall.confirmedBookings.length}</span>
            </div>
            <div className="bbookings-list">
              {selectedHall.confirmedBookings.map(booking => (
                <div key={booking._id} className="mmodern-booking-card">
                  <div className="mmodern-booking-header">
                    <span className="mmodern-event-title">{booking.eventName}</span>
                    <span className="mmodern-status-chip mmodern-confirmed">Confirmed</span>
                  </div>
                  <div className="mmodern-booking-details">
                    <div className="mmodern-detail-item">
                      <span className="mmodern-detail-label">⏰ Time</span>
                      <span className="mmodern-detail-value">
                        {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
                      </span>
                    </div>
                    <div className="mmodern-detail-item">
                      <span className="mmodern-detail-label">👤 Organizer</span>
                      <span className="mmodern-detail-value">{booking.fullName}</span>
                    </div>
                    <div className="mmodern-detail-item">
                      <span className="mmodern-detail-label">📧 Email</span>
                      <span className="mmodern-detail-value">{booking.email}</span>
                    </div>
                    <div className="mmodern-detail-item">
                      <span className="mmodern-detail-label">🎭 Event Type</span>
                      <span className="mmodern-detail-value">{booking.eventType}</span>
                    </div>
                  </div>
                  {booking.description && (
                    <div className="mmodern-event-description">
                      📝 {booking.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tentative Bookings Section */}
        {selectedHall.tentativeBookings && selectedHall.tentativeBookings.length > 0 && (
          <div className="bbooking-section">
            <div className="mmodern-section-header mmodern-tentative-header">
              <span className="mmodern-section-icon">⏳</span>
              <h4>Tentative Bookings (Pending Approval)</h4>
              <span className="mmodern-booking-count">{selectedHall.tentativeBookings.length}</span>
            </div>
            <div className="bookings-list">
              {selectedHall.tentativeBookings.map(booking => {
                const tentativeDate = booking.tentativeDates?.find(td => 
                  new Date(td.date).toDateString() === selectedDate.toDateString()
                );
                return (
                  <div key={booking._id} className="modern-booking-card modern-tentative-card">
                    <div className="mmodern-booking-header">
                      <span className="mmodern-event-title">{booking.eventName}</span>
                      <span className="mmodern-status-chip mmodern-tentative">Tentative</span>
                    </div>
                    <div className="mmodern-booking-details">
                      <div className="mmodern-detail-item">
                        <span className="mmodern-detail-label">⏰ Proposed Time</span>
                        <span className="mmodern-detail-value">
                          {tentativeDate ? `${formatTime(tentativeDate.startTime)} – ${formatTime(tentativeDate.endTime)}` : 'Time TBD'}
                        </span>
                      </div>
                      <div className="mmodern-detail-item">
                        <span className="mmodern-detail-label">👤 Organizer</span>
                        <span className="mmodern-detail-value">{booking.fullName}</span>
                      </div>
                      <div className="mmodern-detail-item">
                        <span className="mmodern-detail-label">📧 Email</span>
                        <span className="mmodern-detail-value">{booking.email}</span>
                      </div>
                      <div className="mmodern-detail-item">
                        <span className="mmodern-detail-label">🎭 Event Type</span>
                        <span className="mmodern-detail-value">{booking.eventType}</span>
                      </div>
                    </div>
                    {booking.description && (
                      <div className="mmodern-event-description">
                        📌 {booking.description}
                      </div>
                    )}
                    <div className="mmodern-tentative-note">
                      <span>⏱️</span> This booking is pending admin approval. Confirmation will be notified via email.
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!selectedHall.confirmedBookings || selectedHall.confirmedBookings.length === 0) && 
         (!selectedHall.tentativeBookings || selectedHall.tentativeBookings.length === 0) && (
          <div className="mmodern-empty-state">
            <div className="mmodern-empty-icon">🏛️</div>
            <p>No bookings for this hall on {formatDate(selectedDate)}</p>
            <p className="mmodern-available-message">✨ This hall is completely available! ✨</p>
          </div>
        )}
      </div>
    </div>

    {/* <div className="modern-book-action"> */}
      <Link 
        to="/f"  
        state={{ 
          hallData: {
            name: selectedHall.name,
            capacity: selectedHall.capacity,
            image: selectedHall.image
          }
        }}
      >
        <button className="mmodern-book-now-btn">
         Book This Hall <span>→</span>
        </button>
      </Link>
    {/* </div> */}
  </div>
</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;