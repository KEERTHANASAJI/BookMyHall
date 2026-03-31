import React from "react";
import { useNavigate } from "react-router-dom";
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

      <ul className="sidebar-menu">
        <li onClick={() => handleNavigate("/home")}>Home</li>
        <li onClick={() => handleNavigate("/reports")}>Reports</li>


        {/* 🔔 Notification Bell */}
        <li className="notification-item" onClick={onNotificationClick}>
          🔔
          <span>Notifications</span>
          {notifications.length > 0 && (
            <>
              <span className="notif-count">{notifications.length}</span>
              {/* OR use this for inline style: */}
              {/* <span className="notif-count-inline">{notifications.length}</span> */}
            </>
          )}
        </li>

        
       






           <li onClick={() => handleNavigate("/")}>Logout</li>

      </ul>

      

       
    </div>
  );
};

export default Sidebar;