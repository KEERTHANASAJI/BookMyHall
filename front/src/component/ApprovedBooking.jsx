import React, { useState, useEffect } from "react";
import "./TotalBooking.css";
import { useNavigate } from "react-router-dom";

const ApprovedBooking = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApprovedBookings();
  }, []);

  const fetchApprovedBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/bookings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Filter only approved bookings
        const approvedBookings = result.data.filter(booking => booking.status === 'approved');
        setBookings(approvedBookings);
      } else {
        throw new Error(result.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching approved bookings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'status-pending', label: 'Pending' },
      approved: { class: 'status-approved', label: 'Approved' },
      rejected: { class: 'status-rejected', label: 'Rejected' },
      cancelled: { class: 'status-cancelled', label: 'Cancelled' },
      completed: { class: 'status-completed', label: 'Completed' }
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
          <p>Loading approved bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="total-bookings-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Approved Bookings</h2>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={fetchApprovedBookings}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
const handleStatusUpdate = async (bookingId, newStatus) => {
  try {
    const response = await fetch(
      `http://localhost:3000/bookings/${bookingId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!response.ok) throw new Error("Failed to update status");

    fetchApprovedBookings(); // refresh page
  } catch (err) {
    alert("Error updating status: " + err.message);
  }
};

const handleDeleteBooking = async (bookingId) => {
  if (window.confirm("Are you sure you want to delete this booking?")) {
    try {
      const response = await fetch(
        `http://localhost:3000/bookings/${bookingId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete booking");

      fetchApprovedBookings();
      alert("Booking deleted successfully");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }
};

  return (
    <div className="total-bookings-container">
      <h1>Approved Bookings</h1>
      <p>Here are the approved events scheduled in the halls:</p>
      <button 
            className="new-booking-btn"
            onClick={() => navigate('/admin')}
          >
           Back
          </button>
      {/* Refresh Button */}
      <div className="refresh-section">
        <button 
          className="refresh-btn"
          onClick={fetchApprovedBookings}
          title="Refresh approved bookings"
        >
          🔄 Refresh
        </button>
        <span className="last-updated">Showing {bookings.length} approved bookings</span>
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
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td>{booking.eventName}</td>
              <td>{booking.email || booking.collegeId || 'N/A'}</td>
              <td>{formatDate(booking.startDate)}</td>
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

    {/* VIEW BUTTON */}
    <button
      className="btn-view"
      onClick={() => navigate(`/booking-details/${booking._id}`)}
    >
      View
    </button>

    {/* REJECT BUTTON */}
    <button
      className="btn-reject"
      onClick={() => handleStatusUpdate(booking._id, "rejected")}
    >
      Reject
    </button>

    {/* DELETE BUTTON */}
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

      {bookings.length === 0 && !loading && (
        <div className="no-bookings">
          <p>No approved bookings found.</p>
        </div>
      )}
    </div>
  );
};

export default ApprovedBooking;