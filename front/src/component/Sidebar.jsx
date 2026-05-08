import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Logout as LogoutIcon,
  
} from '@mui/icons-material';
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose, theme, toggleTheme, notifications, onNotificationClick }) => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <button className="close-btn" onClick={onClose}>×</button>

      {/* HEADER */}
      <div className="sidebar-header">
  <div className="diamond-icon"></div>
  <div className="header-text">
    <h2>ADMIN</h2>
    {/* <p>Dashboard</p> */}
  </div>
</div>

      <ul className="sidebar-menu">
        <li onClick={() => handleNavigate("/home")}>Home</li>
        <li onClick={() => handleNavigate("/reports")}>Reports</li>

        {/* 🔔 Notification */}
        <li className="notification-item" onClick={onNotificationClick}>
          🔔 Notifications
          {notifications.length > 0 && (
            <span className="notif-count">{notifications.length}</span>
          )}
        </li>
      </ul>

      {/* LOGOUT WITH LINE ABOVE - AT BOTTOM */}
      <div className="logout-wrapper">
        <ul className="logout-item">
          <li onClick={() => handleNavigate("/")}><LogoutIcon />Logout</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;