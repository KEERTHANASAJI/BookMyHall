import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyBookings.css';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [expandedBookings, setExpandedBookings] = useState(new Set()); // Track expanded bookings
  const navigate = useNavigate();
  const isCheckingAutoCancel = useRef(false);
  const hasCheckedInitial = useRef(false);

  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Fetch bookings only once when component mounts
  useEffect(() => {
    // if (!user || !user.userId) {
    //   navigate('/');
    //   return;
    // }
    
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      setError('');
      setLoading(true);
      console.log('Fetching bookings for user:', user.username, 'ID:', user.userId);
      
      const response = await fetch(`http://localhost:3000/my-bookings/${user.userId}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const myBookings = await response.json();
      console.log('Bookings from backend:', myBookings);
      
      setBookings(myBookings);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again.');
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = () => {
    console.log('Manual refresh triggered');
    hasCheckedInitial.current = false; // Reset to allow auto-check after manual refresh
    fetchMyBookings();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return '✅';
      case 'rejected': return '❌';
      case 'cancelled': return '🚫';
      default: return '⏳';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const response = await fetch(`http://localhost:3000/bookings/${bookingId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to cancel booking');
        }
        
        alert('Booking cancelled successfully!');
        // Refresh the list after cancellation
        fetchMyBookings();
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking. Please try again.');
      }
    }
  };

  const getEquipmentList = (equipmentArray) => {
    if (!equipmentArray || equipmentArray.length === 0) return 'None';
    return equipmentArray.join(', ');
  };

  const toggleExpand = (bookingId) => {
    setExpandedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Check if a date is less than 3 days away
  const isLessThan3DaysAway = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(dateString);
    eventDate.setHours(0, 0, 0, 0);
    const dayDiff = (eventDate - today) / (1000 * 60 * 60 * 24);
    return dayDiff < 3 && dayDiff >= 0;
  };

  // Get the earliest tentative date from a booking
  const getEarliestTentativeDate = (booking) => {
    if (!booking.tentativeDates || booking.tentativeDates.length === 0) return null;
    const dates = booking.tentativeDates.map(td => {
      if (typeof td === 'string') return new Date(td);
      return new Date(td.date || td);
    }).filter(d => !isNaN(d.getTime()));
    if (dates.length === 0) return null;
    return new Date(Math.min(...dates));
  };

  // Check and auto-cancel bookings that are less than 3 days away and not confirmed
  const checkAndAutoCancel = async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingAutoCancel.current) {
      return;
    }

    isCheckingAutoCancel.current = true;

    try {
      const bookingsToCancel = bookings.filter(booking => {
        // Only check pending bookings with tentative dates
        if (booking.status !== 'pending' && booking.status !== 'approved') return false;
        if (booking.bookingType !== 'multiple') return false;
        if (!booking.tentativeDates || booking.tentativeDates.length === 0) return false;
        
        // Check if booking has confirmed date
        if (booking.confirmedDate) return false;
        
        // Get earliest tentative date
        const earliestDate = getEarliestTentativeDate(booking);
        if (!earliestDate) return false;
        
        // Check if less than 3 days away
        return isLessThan3DaysAway(earliestDate.toISOString().split('T')[0]);
      });

      // Auto-cancel bookings
      if (bookingsToCancel.length > 0) {
        for (const booking of bookingsToCancel) {
          try {
            const response = await fetch(`http://localhost:3000/bookings/${booking._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: 'cancelled',
                cancellationReason: 'Auto-cancelled: No confirmed date provided before 3 days of event'
              })
            });

            if (response.ok) {
              console.log(`Auto-cancelled booking ${booking._id}`);
            }
          } catch (error) {
            console.error(`Error auto-cancelling booking ${booking._id}:`, error);
          }
        }

        // Refresh bookings if any were cancelled (with a small delay to prevent rapid re-renders)
        setTimeout(() => {
          fetchMyBookings();
          isCheckingAutoCancel.current = false;
        }, 500);
      } else {
        isCheckingAutoCancel.current = false;
      }
    } catch (error) {
      console.error('Error in checkAndAutoCancel:', error);
      isCheckingAutoCancel.current = false;
    }
  };

  // Handle confirming a tentative date
  const handleConfirmDate = async (bookingId, tentativeDateIndex) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking || !booking.tentativeDates || !booking.tentativeDates[tentativeDateIndex]) {
      alert('Invalid booking or date selection');
      return;
    }

    const selectedDate = booking.tentativeDates[tentativeDateIndex];
    
    // Handle both formats: string dates or object with date/startTime/endTime
    const dateObj = typeof selectedDate === 'string' 
      ? { date: selectedDate, startTime: '', endTime: '' }
      : selectedDate;
    
    // Ask user to select which hall to confirm
    const hallOptions = [booking.preferredHall];
    if (booking.backupHall && booking.backupHall.trim() !== '') {
      hallOptions.push(booking.backupHall);
    }
    
    const selectedHall = window.prompt(
      `Select hall for ${formatDate(dateObj.date || dateObj)}:\n\n` +
      `Available halls: ${hallOptions.join(', ')}\n\n` +
      `Enter exactly as shown above:`,
      booking.preferredHall
    );
    
    if (!selectedHall) return;
    
    if (!hallOptions.includes(selectedHall)) {
      alert(`Please select one of the available halls: ${hallOptions.join(', ')}`);
      return;
    }
    
    const confirmMessage = `Confirm:\n\n` +
      `Date: ${formatDate(dateObj.date || dateObj)}\n` +
      `Time: ${formatTime(dateObj.startTime)} - ${formatTime(dateObj.endTime)}\n` +
      `Hall: ${selectedHall}\n\n` +
      `Once confirmed, this date will be locked in and other tentative dates will be removed.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch(`http://localhost:3000/bookings/${bookingId}/confirm-tentative-date`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            confirmedDateIndex: tentativeDateIndex,
            selectedHall: selectedHall
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to confirm date');
        }

        const result = await response.json();
        alert(result.message || 'Date confirmed successfully!');
        
        // Refresh bookings
        fetchMyBookings();
      } catch (error) {
        console.error('Error confirming date:', error);
        alert(`Error confirming date: ${error.message}`);
      }
    }
  };

  // Check bookings for auto-cancel only once after initial load completes
  useEffect(() => {
    if (!loading && bookings.length > 0 && !hasCheckedInitial.current) {
      hasCheckedInitial.current = true;
      // Use setTimeout to prevent blocking the initial render and allow UI to stabilize
      const timeoutId = setTimeout(() => {
        checkAndAutoCancel();
      }, 1500);
      
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div className="my-bookings-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <div className="bookings-header">
        <div className="header-content">
          <h1>My Bookings</h1>
          <p>Manage and view all your hall booking requests</p>
          {user && (
            <div className="user-welcome">
              Welcome back, <strong>{user.username || user.name}</strong>!
            </div>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={handleManualRefresh}
            title="Refresh bookings"
          >
            🔄 Refresh
          </button>
          <button 
            className="new-booking-btn"
            onClick={() => navigate('/h')}
          >
            + New Booking
          </button>
           <button 
            className="new-booking-btn"
            onClick={() => navigate('/home')}
          >
           Back
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={handleManualRefresh} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="bookings-stats">
        <div className="stat-card">
          <div className="stat-number">{bookings.length}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{bookings.filter(b => b.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{bookings.filter(b => b.status === 'approved').length}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{bookings.filter(b => b.status === 'rejected').length}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{ bookings.filter(b => b.status === 'cancelled').length}</div>
          <div className="stat-label">Cancelled</div>
</div>

      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Bookings
        </button>
        <button 
          className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved
        </button>
        <button 
          className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected
        </button>
      
      <button 
  className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
  onClick={() => setFilter('cancelled')}
>
  Cancelled
</button>
</div>
      {filteredBookings.length === 0 ? (
        <div className="no-bookings">
          <div className="no-bookings-icon">📅</div>
          <h3>No bookings found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't made any hall bookings yet."
              : `No ${filter} bookings found.`
            }
          </p>
          <div className="no-bookings-actions">
            <button 
              className="cta-button"
              onClick={() => navigate('/h')}
            >
              Book a Hall Now
            </button>
            {/* <button 
              className="refresh-btn"
              onClick={handleManualRefresh}
            >
              🔄 Refresh
            </button> */}
          </div>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((booking) => (
            <div 
              key={booking._id} 
              className={`booking-card ${expandedBookings.has(booking._id) ? 'expanded' : ''}`}
              onClick={() => toggleExpand(booking._id)}
            >
              <div className="booking-summary">
                <div className="event-info">
                  <h3 className="event-name">{booking.eventName}</h3>
                  <span className="event-type">{booking.eventType}</span>
                </div>
                <div className="booking-status">
                  <span className={`status-badge ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)} {booking.status.toUpperCase()}
                  </span>
                </div>
                <div className="summary-details">
                  <div className="summary-item">
                    <span className="label">Hall:</span>
                    <span className="value">{booking.preferredHall}</span>
                  </div>
                  {booking.bookingType === 'single' && booking.startDate && (
                    <div className="summary-item">
                      <span className="label">Date:</span>
                      <span className="value">{formatDate(booking.startDate)}</span>
                    </div>
                  )}
                  {booking.bookingType === 'multiple' && booking.tentativeDates && booking.tentativeDates.length > 0 && (
                    <div className="summary-item">
                      <span className="label">Dates:</span>
                      <span className="value">
                       {booking.dateConfirmed ? (
  <span style={{ color: '#28a745', fontWeight: 'bold' }}>
    ✅ Confirmed: {formatDate(booking.startDate)}
  </span>
) : (
                          <>
                            <span style={{ color: booking.status === 'approved' ? '#17a2b8' : '#6c757d' }}>
                              {booking.tentativeDates.length} tentative
                            </span>
                            {(() => {
                              const earliestDate = getEarliestTentativeDate(booking);
                              return earliestDate && isLessThan3DaysAway(earliestDate.toISOString().split('T')[0]) ? (
                                <span style={{ 
                                  color: '#dc3545', 
                                  marginLeft: '8px', 
                                  fontWeight: 'bold',
                                  fontSize: '12px'
                                }}>
                                  ⚠️Too late
                                </span>
                              ) : null;
                            })()}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="summary-item">
                    <span className="label">Attendees:</span>
                    <span className="value">{booking.attendees}</span>
                  </div>
                </div>
                <div className="expand-indicator">
                  {expandedBookings.has(booking._id) ? '🔽' : '▶️'}
                </div>
              </div>
              
              {expandedBookings.has(booking._id) && (
                <div className="booking-details">
                  <div className="detail-section">
                    <h4>Hall & Timing</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Hall:</span>
                        <span className="value">{booking.preferredHall}</span>
                      </div>
                      {booking.backupHall && (
                        <div className="detail-item">
                          <span className="label">Backup Hall:</span>
                          <span className="value">{booking.backupHall}</span>
                        </div>
                      )}
                      {booking.bookingType === 'single' && booking.startDate && (
                        <>
                          <div className="detail-item">
                            <span className="label">Date:</span>
                            <span className="value">{formatDate(booking.startDate)}</span>
                          </div>
                          <div className="detail-item">
                            <span className="label">Time:</span>
                            <span className="value">
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </span>
                          </div>
                        </>
                      )}
                      {booking.bookingType === 'multiple' && booking.tentativeDates && booking.tentativeDates.length > 0 && (
                        <div className="detail-item full-width">
                          <span className="label">Tentative Dates:</span>
                          {booking.dateConfirmed ? (
                            <div className="confirmed-date-banner" style={{
                              padding: '15px',
                              backgroundColor: '#d4edda',
                              border: '2px solid #c3e6cb',
                              borderRadius: '8px',
                              marginTop: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <div>
                                <strong style={{ fontSize: '16px', color: '#155724' }}>✅ CONFIRMED BOOKING</strong>
                                <div style={{ marginTop: '5px' }}>
                                  <strong>Date:</strong> {formatDate(booking.startDate)}<br />
                                  <strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}<br />
                                  <strong>Hall:</strong> {booking.confirmedHall || booking.preferredHall}
                                </div>
                              </div>
                              <span style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '5px 10px',
                                borderRadius: '5px',
                                fontWeight: 'bold'
                              }}>
                                CONFIRMED
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className="tentative-dates" style={{ marginTop: '10px' }}>
                                {booking.tentativeDates.map((date, index) => {
                                  const dateStr = typeof date === 'string' ? date : (date.date || date);
                                  const startTime = typeof date === 'object' ? (date.startTime || '') : '';
                                  const endTime = typeof date === 'object' ? (date.endTime || '') : '';
                                  const isUrgent = isLessThan3DaysAway(dateStr);
                                  
                                  return (
                                    <div 
                                      key={index} 
                                      className="tentative-date"
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        backgroundColor: isUrgent ? '#fff3cd' : '#f8f9fa',
                                        border: `2px solid ${isUrgent ? '#ffc107' : '#dee2e6'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isUrgent) {
                                          handleConfirmDate(booking._id, index);
                                        }
                                      }}
                                    >
                                      <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <span style={{ 
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            color: isUrgent ? '#856404' : '#333'
                                          }}>
                                            Option {index + 1}
                                          </span>
                                          {isUrgent && (
                                            <span style={{
                                              backgroundColor: '#ffc107',
                                              color: '#856404',
                                              padding: '2px 8px',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              fontWeight: 'bold'
                                            }}>
                                              ⚠️ URGENT
                                            </span>
                                          )}
                                        </div>
                                        <div style={{ marginTop: '5px' }}>
                                          <strong>Date:</strong> {formatDate(dateStr)}<br />
                                          {startTime && endTime && (
                                            <><strong>Time:</strong> {formatTime(startTime)} - {formatTime(endTime)}</>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleConfirmDate(booking._id, index);
                                        }}
                                        style={{
                                          padding: '8px 16px',
                                          backgroundColor: isUrgent ? '#dc3545' : '#28a745',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: isUrgent ? 'not-allowed' : 'pointer',
                                          fontSize: '13px',
                                          fontWeight: 'bold',
                                          opacity: isUrgent ? 0.7 : 1,
                                          pointerEvents: isUrgent ? 'none' : 'auto'
                                        }}
                                        title={isUrgent ? "Too late to confirm (less than 3 days away)" : "Click to confirm this date"}
                                      >
                                        {isUrgent ? 'Too Late' : 'Confirm Date'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                              {(() => {
                                const earliestDate = getEarliestTentativeDate(booking);
                                return earliestDate && isLessThan3DaysAway(earliestDate.toISOString().split('T')[0]) ? (
                                  <div style={{
                                    marginTop: '15px',
                                    padding: '12px',
                                    backgroundColor: '#f8d7da',
                                    border: '2px solid #f5c6cb',
                                    borderRadius: '8px',
                                    color: '#721c24',
                                    fontWeight: 'bold'
                                  }}>
                                    {/* ⚠️ <strong>URGENT ACTION REQUIRED:</strong> */}
                                    Your booking is automatically cancelled  
                                    <div style={{ marginTop: '5px', fontSize: '14px', fontWeight: 'normal' }}>
                                      Booking has been confirmed three days before.
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Event Details</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="label">Attendees:</span>
                        <span className="value">{booking.attendees} people</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Booking Type:</span>
                        <span className="value capitalize">{booking.bookingType}</span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="label">Submitted:</span>
                        <span className="value">{formatDate(booking.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Requirements</h4>
                    <div className="requirements-grid">
                      <div className="requirement-item">
                        <span className="label">AV Equipment:</span>
                        <span className="value">{getEquipmentList(booking.avEquipment)}</span>
                      </div>
                      <div className="requirement-item">
                        <span className="label">Furniture:</span>
                        <span className="value">{getEquipmentList(booking.furniture)}</span>
                      </div>
                      <div className="requirement-item">
                        <span className="label">Internet:</span>
                        <span className="value">{booking.needsInternet ? 'Required' : 'Not Required'}</span>
                      </div>
                      <div className="requirement-item">
                        <span className="label">Security:</span>
                        <span className="value">{booking.needsSecurity ? 'Required' : 'Not Required'}</span>
                      </div>
                    </div>
                  </div>

                  {booking.additionalNotes && (
                    <div className="detail-section">
                      <h4>Additional Notes</h4>
                      <p className="additional-notes">{booking.additionalNotes}</p>
                    </div>
                  )}

                  {booking.adminNotes && (
                    <div className="detail-section admin-notes">
                      <h4>Admin Notes</h4>
                      <p className="admin-notes-text">{booking.adminNotes}</p>
                    </div>
                  )}

                  <div className="booking-actions">
                    {(booking.status === 'pending' || booking.status === 'approved') && (
                    <button 
                          className="action-btn cancel-btn"
                          onClick={(e) => {
                        e.stopPropagation();
                        handleCancelBooking(booking._id);
                  }}>
  
                   Cancel Booking
                  </button>
              )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;