import React, { useState, useEffect } from "react";
import "./TotalBooking.css";
import { useNavigate } from "react-router-dom";
const CompleteBooking = () => {
  const navigate = useNavigate();
  const [completedEvents, setCompletedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3000/bookings");

      if (!response.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error("Failed to load bookings");
      }

      const today = new Date();

      // Filter: approved + date already passed
      const completed = result.data.filter((booking) => {
        if (booking.status !== "approved") return false;
        if (!booking.startDate) return false;

        const eventDate = new Date(booking.startDate);

        return eventDate < today; // event took place
      });

      setCompletedEvents(completed);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US");
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="total-bookings-container">
        <p>Loading completed bookings…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="total-bookings-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="total-bookings-container">
      <h1>Completed Bookings</h1>
      <p>These events have already taken place:</p>
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
          </tr>
        </thead>
        <tbody>
          {completedEvents.map((booking) => (
            <tr key={booking._id}>
              <td>{booking.eventName}</td>
              <td>{booking.department || booking.collegeId || "N/A"}</td>
              <td>{formatDate(booking.startDate)}</td>
              <td>{booking.preferredHall}</td>
              <td>
                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </td>
              <td>
                <span className="status-badge status-approved">Completed</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {completedEvents.length === 0 && (
        <p>No completed events yet.</p>
      )}
    </div>
  );
};

export default CompleteBooking;
