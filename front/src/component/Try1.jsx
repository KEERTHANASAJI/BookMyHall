import React, { useState } from 'react';
import './Try1.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useEffect } from "react";

const halls = [
  {
    name: "Auditorium",
    capacity: 1000,
    image: "https://vimalacollege.edu.in/ssr2021/images/seminar/auditorium/aud1.jpg",
    description: "Our largest venue featuring state-of-the-art sound system, professional lighting, and comfortable seating. Perfect for large conferences, performances, and major events."
  },
  {
    name: "Euphresia Conference Hall",
    capacity: 20,
    image: "https://vimalacollege.edu.in/ssr2021/images/seminar/ech/001.jpg",
    description: "Versatile space with flexible seating arrangements, modern AV equipment, and excellent acoustics. Ideal for seminars, workshops, and medium-sized gatherings."
  },
  {
    name: "Silver Jubilee Seminar Hall",
    capacity: 130,
    image: "https://vimalacollege.edu.in/ssr2021/images/seminar/sjsh/stage.jpg",
    description: "Intimate setting with comfortable seating and modern presentation facilities. Perfect for small meetings, training sessions, and focused discussions."
  },
  {
    name: "Lissieux Seminar Hall",
    capacity: 150,
    image: "https://vimalacollege.edu.in/ssr2021/images/seminar/lsh/stage.jpg",
    description: "Professional conference setup with boardroom-style seating, high-quality projection system, and video conferencing capabilities."
  },
  {
    name: "Marian Hall",
    capacity: 350,
    image: "https://vimalacollege.edu.in/ssr2021/images/seminar/gjmh/stage.jpg",
    description: "Academic-focused space with tiered seating, advanced presentation technology, and excellent visibility from all angles."
  },
  {
    name: "Christ Conference Hall",
    capacity: 30,
    image: "https://vimalacollege.edu.in/ssr2021/images/seminar/cch/001.jpg",
    description: "Cozy venue with flexible furniture arrangement, perfect for small group discussions, interviews, and intimate presentations."
  }
];

const Try1 = () => {
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const username = user ? user.username : null;
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  // const toggleDropdown = () => {
  //   setDropdownOpen(!dropdownOpen);
  // };

 
// In Try1.jsx, update the handleMyBookings function:
const handleMyBookings = () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  console.log('Navigating to MyBookings with user:', currentUser);
  
  if (currentUser && currentUser.userId) {
    navigate("/my-bookings");
  } else {
    console.log('No user found, redirecting to login');
    navigate("/");
  }
  setDropdownOpen(false);
};
const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);

// Fetch notifications
useEffect(() => {
  if (!user) return;

  fetch(`http://localhost:3000/notifications/${user.userId}`)
    .then(res => res.json())
    .then(data => setNotifications(data));
}, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.profile-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
const openNotifications = async () => {
  if (!user?.userId) return;

  if (!showNotifications) {
    const res = await fetch(
      `http://localhost:3000/notifications/${user.userId}`
    );
    const data = await res.json();
    setNotifications(data);
  } else {
    await fetch(
      `http://localhost:3000/notifications/mark-read/${user.userId}`,
      { method: "PATCH" }
    );
  }

  setShowNotifications(!showNotifications);
};


  //close notifications when clicking outside
useEffect(() => {
  const handleClickOutside = (event) => {
    if (!event.target.closest('.notification-bell') &&
        !event.target.closest('.notif-dropdown')) {
      setShowNotifications(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  const handleNotificationClose = async (markRead = false) => {
  setShowNotifications(false);

  if (markRead && user?.userId) {
    await fetch(
      `http://localhost:3000/notifications/mark-read/${user.userId}`,
      { method: "PATCH" }
    );

    // clear UI like admin
    setNotifications([]);
  }
};

  return (
    <div className="frontpage-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">BookMyHall</div>
        <div className="navbar-links">
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('hall').scrollIntoView({ behavior: 'smooth' });
          }}>Available Halls</a>
          <a href="#" className="nav-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
          }}>About</a>
          {/* <a href="#" className="nav-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
          }}>Contact Us</a> */}
          
          {/* Conditionally render profile circle with dropdown if user is logged in */}
          {username ? (
  <>
    {/* Notification Bell */}
    {/* <div className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}> */}
    <div className="notification-bell" onClick={openNotifications}>
      🔔
      {notifications.length > 0 && (
        <span className="notif-count">{notifications.filter(n => !n.isRead).length}</span>
      )}
    </div>

{showNotifications && (
  <>
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/40"
      onClick={() => handleNotificationClose(false)}
    />

    {/* Panel */}
    <div className="notif-dropdown">
      <div className="notif-header">Notifications</div>

      {notifications.length === 0 ? (
        <div className="no-notifications">No notifications</div>
      ) : (
        notifications.map((n, index) => (
          <div key={index} className="notif-item">
            <div className="notif-icon">🔔</div>
            <div className="notif-content">
              <div className="notif-message">{n.message}</div>
              <div className="notif-time">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))
      )}

      {/* ✅ ADMIN-STYLE FOOTER */}
      <div className="notification-footer">
        <button
          className="mark-all-read"
          onClick={() => handleNotificationClose(true)}
        >
          Mark all as read
        </button>
      </div>
    </div>
  </>
)}

    <div className="profile-container">
      <div className="profile-circle" >
        {username.charAt(0).toUpperCase()}
      </div>
      {/* {dropdownOpen && ( */}
        <div className="dropdown-menu">
          <button className="dropdown-item" onClick={handleMyBookings}>
            My Bookings
          </button>
          <button className="dropdown-item" onClick={handleLogout}>
            Logout
          </button>
        </div>
      {/* )} */}
    </div>
  </>
) : (
  <Link to="/" className="nav-link">Login</Link>
)}

        </div>
      </nav>

      {/* Rest of your component remains exactly the same */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Our College Halls</h1>
          <p className="hero-description">
            Discover and book the perfect hall for your events, seminars, and celebrations. Our college offers a variety of halls with modern amenities and flexible capacities to suit your needs.
          </p>
          <Link to="/h">
            <button className="cta-button">
              Book Now
            </button>
          </Link>
        </div>
      </section>

      <section id="hall" className="available-section">
  <div className="hall-container">
    <h1 className="hall-heading">Available Halls</h1>
    <div className="hall-grid">
      {halls.map((hall, index) => (
        <div className="hall-card" key={index}>
          <img src={hall.image} alt={hall.name} className="hall-img" />
          <div className="hall-details">
            <h2 className="hall-title">{hall.name}</h2>
            <p className="hall-capacity">Capacity: <span>{hall.capacity}</span></p>
            <p className="hall-description">{hall.description}</p>
            <Link to={`/hall/${index}`}>
              <button className="hall-button">View Details</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      <section id="about" className="about-section">
        <div className="about-container">
          <div className="about-content">
            <h2 className="about-title">About College Halls</h2>
            <div className="about-description">
              <p>
                College Halls is your premier destination for booking state-of-the-art event spaces within our educational institution. 
                We provide a seamless booking experience for  faculty, and external organizations looking to host events, 
                conferences, seminars, and celebrations.
              </p>
              <p>
                Our commitment to excellence is reflected in our modern facilities, competitive pricing, and dedicated support team. 
                Whether you're planning a small seminar or a large conference, we have the perfect space to meet your needs.
              </p>
            </div>
            <div className="about-features">
              <div className="feature-row">
                <div className="feature-text">
                  <h3>Easy Booking Process</h3>
                  <p>Our streamlined booking system ensures a quick and hassle-free reservation process. Get instant confirmation and detailed information about your selected hall.</p>
                </div>
                <div className="feature-text">
                  <h3>Modern Facilities</h3>
                  <p>All our halls are equipped with the latest audio-visual equipment, high-speed internet, and professional lighting systems to support your events.</p>
                </div>
              </div>
              <div className="feature-row">
                <div className="feature-text">
                  <h3>Flexible Capacity Options</h3>
                  <p>From intimate gatherings of 20 people to large events accommodating 200+ attendees, we offer versatile spaces to suit any event size.</p>
                </div>
                <div className="feature-text">
                  <h3>Professional Support</h3>
                  <p>Our experienced team provides comprehensive support throughout your booking process, from initial inquiry to event completion.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
  <div className="footer-content">
    <div className="footer-section">
      <h3 className="footer-section-title">College Halls</h3>
      <p className="footer-description">
        Simple and smart hall booking system for college events.
      </p>
    </div>

    <div className="footer-section">
      <h3 className="footer-section-title">Quick Links</h3>
      <ul className="footer-links-list">
        <li><a href="#" className="footer-link">Home</a></li>
        <li><a href="#hall" className="footer-link">Halls</a></li>
        <li><a href="#about" className="footer-link">About</a></li>
        <li><a href="/" className="footer-link">Login</a></li>
      </ul>
    </div>
  </div>

  <div className="footer-bottom">
    <div className="footer-copyright">
      © {new Date().getFullYear()} College Halls. All rights reserved.
    </div>
  </div>
</footer>
    </div>
  );
};

export default Try1;