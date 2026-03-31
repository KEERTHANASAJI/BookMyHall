import React from "react";
import "./NotificationPanel.css"; // Create this CSS file

const NotificationPanel = ({ open, onClose, notifications }) => {
  return (
    <>
      {/* Background Overlay */}
      <div
        className={`notification-overlay ${open ? "active" : ""}`}
        onClick={onClose}
      ></div>

      {/* Sliding Panel */}
      <div className={`notification-panel ${open ? "active" : ""}`}>
        <div className="notification-header">
          <h2>Notifications</h2>
          <button className="close-notification" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="notification-content">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <div className="empty-icon">📭</div>
              <p>No new notifications</p>
              <small>You're all caught up!</small>
            </div>
          ) : (
            notifications.map((noti, index) => (
              <div
                key={index}
                className="notification-item"
                onClick={() => {
                  // Handle notification click if needed
                  console.log("Notification clicked:", noti);
                }}
              >
                <div className="notification-icon">
                  {noti.title?.includes("approved") ? "✅" : 
                   noti.title?.includes("rejected") ? "❌" : "📢"}
                </div>
                <div className="notification-details">
                  <h4>{noti.title || "New Notification"}</h4>
                  <p>{noti.message}</p>
                  <span className="notification-time">
                    {new Date(noti.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="notification-footer">
            <button
  className="mark-all-read"
  onClick={() => {
    onClose(true); // tell parent this was a "mark read" action
  }}
>
  Mark all as read
</button>

          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;