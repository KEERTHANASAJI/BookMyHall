import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./TotalBooking.css";


const TotalBooking = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to get the event date for filtering
  const getEventDate = (booking) => {
    if (booking.bookingType === 'single') {
      return booking.startDate;
    } else if (booking.bookingType === 'multiple' && booking.tentativeDates && booking.tentativeDates.length > 0) {
      return booking.tentativeDates[0].date;
    }
    return null;
  };

  // Unified filter - searches across all fields including date
  const filteredBookings = bookings.filter(booking => {
    // Get formatted date for searching
    const eventDate = getEventDate(booking);
    const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US') : '';
    
    // Get time string for searching
    const timeString = booking.bookingType === 'single' 
      ? `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`
      : `Multiple Dates (${booking.tentativeDates?.length || 0})`;
    
    // Get date string for multiple bookings
    const dateString = booking.bookingType === 'single'
      ? formattedDate
      : `Multiple Dates (${booking.tentativeDates?.length || 0})`;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || (
      booking.eventName?.toLowerCase().includes(searchLower) ||
      booking.department?.toLowerCase().includes(searchLower) ||
      booking.collegeId?.toLowerCase().includes(searchLower) ||
      booking.preferredHall?.toLowerCase().includes(searchLower) ||
      booking.status?.toLowerCase().includes(searchLower) ||
      booking.username?.toLowerCase().includes(searchLower) ||
      formattedDate.toLowerCase().includes(searchLower) ||
      dateString.toLowerCase().includes(searchLower) ||
      timeString.toLowerCase().includes(searchLower)
    );
    
    // Status filter
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="total-bookings-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="total-bookings-container">
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
      </div>
    );
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  return (
    <div className="total-bookings-container">
      <div className="content-wrapper">
        <h1>Total Bookings</h1>
        <p>Here are all the events scheduled in the halls:</p>
        
        <div className="top-bar">
          <button className="new-booking-btn" onClick={() => navigate('/admin')}>
            ← Back
          </button>
          
          <div className="filters-container">
            {/* Unified Search Input - Searches everything */}
            <div className="search-container">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by event name, organizer, hall, date, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button className="search-clear-btn" onClick={() => setSearchTerm("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>
            
            {/* Status Filter Dropdown */}
            <div className="status-filter-container">
              <select 
                className="status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">📊 All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
                <option value="cancelled">🚫 Cancelled</option>
              </select>
            </div>
            
            {/* Filter Results Count */}
            {(searchTerm || statusFilter !== "all") && (
              <div className="filter-results">
                <span className="filter-results-count">
                  {filteredBookings.length} result(s)
                </span>
                <button className="clear-filters-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
        
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Organizer</th>
              <th>Date</th>
              <th>Hall</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="search-empty-icon">🔍</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                    No bookings found
                  </div>
                  <div style={{ color: '#64748b', marginBottom: '20px' }}>
                    {searchTerm && `Matching "${searchTerm}" `}
                    {statusFilter !== "all" && `with status ${statusFilter} `}
                  </div>
                  <button 
                    onClick={clearAllFilters}
                    style={{
                      marginTop: '10px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Clear All Filters
                  </button>
                 </td>
               </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.eventName}</td>
                  <td>{booking.department || booking.collegeId || 'N/A'}</td>
                  <td>
                    {booking.bookingType === 'single' ? (
                      `${formatDate(booking.startDate)}`
                    ) : (
                      `Multiple Dates (${booking.tentativeDates?.length || 0})`
                    )}
                  </td>
                  <td>{booking.preferredHall}</td>
                  <td>
                    {booking.bookingType === 'single' ? (
                      `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`
                    ) : (
                      `Multiple Dates (${booking.tentativeDates?.length || 0})`
                    )}
                  </td>
                  <td>
                    {getStatusBadge(booking.status)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/booking-details/${booking._id}`)}
                      >
                        View
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TotalBooking;