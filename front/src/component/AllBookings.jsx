import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './All.css';
const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:3000/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the bookings list
      fetchBookings();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const response = await fetch(`http://localhost:3000/bookings/${bookingId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete booking');
        }

        // Refresh the bookings list
        fetchBookings();
        alert('Booking deleted successfully');
      } catch (err) {
        console.error('Error deleting booking:', err);
        alert('Failed to delete booking: ' + err.message);
      }
    }
  };

  const toggleRowExpansion = (bookingId) => {
    setExpandedRow(expandedRow === bookingId ? null : bookingId);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = 
      booking.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.collegeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Pending' },
      approved: { class: 'status-approved', label: 'Approved' },
      rejected: { class: 'status-rejected', label: 'Rejected' },
      cancelled: { class: 'status-cancelled', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { class: 'status-pending', label: status };
    
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTimeRange = (booking) => {
    if (booking.bookingType === 'single') {
      return (
        <div>
          <div><strong>Date:</strong> {formatDate(booking.startDate)}</div>
          <div><strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
        </div>
      );
    } else {
      return (
        <div>
          <div><strong>Multiple Dates:</strong> {booking.tentativeDates?.length || 0} dates</div>
          {booking.tentativeDates?.slice(0, 2).map((date, index) => (
            <div key={index} className="tentative-date-small">
              {formatDate(date.date)}: {formatTime(date.startTime)}-{formatTime(date.endTime)}
            </div>
          ))}
          {booking.tentativeDates?.length > 2 && (
            <div className="more-dates">+{booking.tentativeDates.length - 2} more dates</div>
          )}
        </div>
      );
    }
  };

  const renderExpandedDetails = (booking) => {
    return (
      <div className="expanded-details">
        <div className="details-grid">
          <div className="detail-section">
            <h4>Event Details</h4>
            <div className="detail-row">
              <span>Event Type:</span>
              <strong>{booking.eventType || 'N/A'}</strong>
            </div>
            <div className="detail-row">
              <span>Description:</span>
              <span>{booking.description || 'No description'}</span>
            </div>
            <div className="detail-row">
              <span>Expected Attendees:</span>
              <strong>{booking.attendees || 'N/A'}</strong>
            </div>
          </div>

          <div className="detail-section">
            <h4>Requester Information</h4>
            <div className="detail-row">
              <span>Full Name:</span>
              <strong>{booking.fullName || 'N/A'}</strong>
            </div>
            <div className="detail-row">
              <span>College ID:</span>
              <strong>{booking.collegeId || 'N/A'}</strong>
            </div>
            <div className="detail-row">
              <span>Department/Club:</span>
              <strong>{booking.department || 'N/A'}</strong>
            </div>
            <div className="detail-row">
              <span>Email:</span>
              <span>{booking.email || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span>Phone:</span>
              <span>{booking.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="detail-section">
            <h4>Technical Requirements</h4>
            <div className="detail-row">
              <span>AV Equipment:</span>
              <span>
                {booking.avEquipment?.length > 0 
                  ? booking.avEquipment.join(', ')
                  : 'None requested'
                }
              </span>
            </div>
            <div className="detail-row">
              <span>Furniture:</span>
              <span>
                {booking.furniture?.length > 0 
                  ? booking.furniture.join(', ')
                  : 'None requested'
                }
              </span>
            </div>
            <div className="detail-row">
              <span>Internet Access:</span>
              <strong>{booking.needsInternet ? 'Yes' : 'No'}</strong>
            </div>
            <div className="detail-row">
              <span>Setup Time Needed:</span>
              <strong>{booking.needsSetupTime ? 'Yes' : 'No'}</strong>
            </div>
            <div className="detail-row">
              <span>Security/First-Aid:</span>
              <strong>{booking.needsSecurity ? 'Yes' : 'No'}</strong>
            </div>
          </div>

          {booking.additionalNotes && (
            <div className="detail-section full-width">
              <h4>Additional Notes</h4>
              <div className="detail-row">
                <span>{booking.additionalNotes}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Error Loading Bookings</h2>
        <p>{error}</p>
        <button 
          className="btn-primary"
          onClick={fetchBookings}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="all-bookings-container">
     

      <div className="bookings-content">
      

        {/* Bookings Table */}
        <div className="bookings-table-container">
          {filteredBookings.length === 0 ? (
            <div className="no-bookings">
              <p>No bookings found matching your criteria.</p>
            </div>
          ) : (
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Event Name</th>
                  <th>Event Type</th>
                  <th>Hall</th>
                  <th>Date & Time</th>
                  <th>Requester</th>
                  <th>Department</th>
                  <th>Attendees</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <React.Fragment key={booking._id}>
                    <tr className="booking-row">
                      <td className="reference-cell">
                        <strong>{booking.bookingReference || 'N/A'}</strong>
                      </td>
                      <td className="event-cell">
                        <div className="event-name">{booking.eventName}</div>
                        <button 
                          className="expand-btn"
                          onClick={() => toggleRowExpansion(booking._id)}
                        >
                          {expandedRow === booking._id ? '▲ Less' : '▼ More'}
                        </button>
                      </td>
                      <td className="event-type-cell">
                        {booking.eventType || 'N/A'}
                      </td>
                      <td className="hall-cell">
                        <div className="primary-hall">{booking.preferredHall}</div>
                        {booking.backupHall && (
                          <div className="backup-hall">Backup: {booking.backupHall}</div>
                        )}
                      </td>
                      <td className="datetime-cell">
                        {formatDateTimeRange(booking)}
                      </td>
                      <td className="requester-cell">
                        <div className="requester-name">{booking.fullName}</div>
                        <div className="requester-id">{booking.collegeId}</div>
                        <div className="requester-email">{booking.email}</div>
                      </td>
                      <td className="department-cell">
                        {booking.department || 'N/A'}
                      </td>
                      <td className="attendees-cell">
                        {booking.attendees || 'N/A'}
                      </td>
                      <td className="status-cell">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="btn-view"
                            onClick={() => navigate(`/booking-details/${booking._id}`)}
                          >
                            View Details
                          </button>
                          
                          {booking.status === 'pending' && (
                            <>
                              <button
                                className="btn-approve"
                                onClick={() => handleStatusUpdate(booking._id, 'approved')}
                              >
                                Approve
                              </button>
                              <button
                                className="btn-reject"
                                onClick={() => handleStatusUpdate(booking._id, 'rejected')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteBooking(booking._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === booking._id && (
                      <tr className="expanded-row">
                        <td colSpan="10">
                          {renderExpandedDetails(booking)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary */}
        <div className="table-summary">
          <p>
            Showing {filteredBookings.length} of {bookings.length} bookings
            {filter !== 'all' && ` (filtered by ${filter})`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AllBookings;