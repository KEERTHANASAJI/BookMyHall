import React from "react";
import "./Pages.css";

const Help = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Help & Support</h1>

      <section className="card">
        <h2>Overview</h2>
        <p>
          This page helps users understand how to use the College Hall Booking
          System, including booking, cancellation, and notification features.
        </p>
      </section>

      <section className="card">
        <h2>How to Book a Hall</h2>
        <ol>
          <li>Login or Sign Up to the system</li>
          <li>You will be redirected to the Home Page</li>
          <li>Click on <strong>Book Hall</strong></li>
          <li>Select date(s) from the calendar</li>
          <li>Fill in hall, event, and requester details</li>
          <li>Select required facilities</li>
          <li>Agree to terms and submit the request</li>
        </ol>
      </section>

      <section className="card">
        <h2>Booking Sections</h2>
        <ul>
          <li><strong>Hall & Event Details:</strong> Hall selection, event info, date & time</li>
          <li><strong>Requester Information:</strong> Name, department, contact details</li>
          <li><strong>Technical Requirements:</strong> Projector, sound system, Wi-Fi, etc.</li>
          <li><strong>Terms & Conditions:</strong> Booking confirmation rules</li>
        </ul>
      </section>

      <section className="card">
        <h2>Booking Status & Notifications</h2>
        <p>
          All updates such as booking approval, rejection, and cancellation are
          shown as <strong>in-website notifications</strong>. No email communication
          is used.
        </p>
      </section>

      <section className="card">
        <h2>User Dashboard</h2>
        <ul>
          <li>View booking status</li>
          <li>View booking history</li>
          <li>Cancel bookings</li>
        </ul>
        <p>
          When a booking is cancelled, the admin receives a notification
          instantly.
        </p>
      </section>

      <section className="card">
        <h2>Frequently Asked Questions</h2>
        <p><strong>Q:</strong> Is booking confirmed immediately?</p>
        <p><strong>A:</strong> No, booking is confirmed only after admin approval.</p>

        <p><strong>Q:</strong> How will I get updates?</p>
        <p><strong>A:</strong> Through website notifications and dashboard status.</p>
      </section>
    </div>
  );
};

export default Help;
