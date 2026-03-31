import React from "react";
import "./Pages.css";

const Reports = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Reports</h1>

      <section className="card">
        <h2>Overview</h2>
        <p>
          The Reports module provides detailed insights into hall bookings for
          administrators and booking history for users.
        </p>
      </section>

      <section className="card">
        <h2>Booking Summary Report</h2>
        <ul>
          <li>Booking ID</li>
          <li>User Name & Department</li>
          <li>Hall Name</li>
          <li>Event Date(s)</li>
          <li>Status (Pending / Approved / Rejected / Cancelled)</li>
        </ul>
      </section>

      <section className="card">
        <h2>Hall Usage Report</h2>
        <p>
          Displays how frequently the auditorium is booked, including approved
          and cancelled bookings.
        </p>
      </section>

      <section className="card">
        <h2>Date-wise Booking Report</h2>
        <p>
          Shows bookings on selected dates using a calendar-based view to avoid
          scheduling conflicts.
        </p>
      </section>

      <section className="card">
        <h2>User-wise Booking Report</h2>
        <p>
          Displays individual user booking history and cancellation records for
          transparency.
        </p>
      </section>

      <section className="card">
        <h2>Notification Activity Report</h2>
        <p>
          Tracks all system notifications such as booking submissions, approvals,
          rejections, and cancellations.
        </p>
      </section>

      <section className="card">
        <h2>Access Control</h2>
        <ul>
          <li>Admin: Full access to all reports</li>
          <li>User: Access only to personal booking reports</li>
        </ul>
      </section>
    </div>
  );
};

export default Reports;
