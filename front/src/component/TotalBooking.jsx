import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "./TotalBooking.css";


const TotalBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  return (
    <div className="total-bookings-container">
      <h1>Total Bookings</h1>
      <p>Here are all the events scheduled in the halls:</p>
<button 
            className="new-booking-btn"
            onClick={() => navigate('/admin')}
          >
           Back
          </button>
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
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td>{booking.eventName}</td>
              <td>{booking.department || booking.collegeId || 'N/A'}</td>
              <td> {booking.bookingType === 'single' ? (
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TotalBookings;