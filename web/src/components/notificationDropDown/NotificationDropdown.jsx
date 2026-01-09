import React from "react";
import "./NotificationDropdown.css";

const NotificationDropdown = ({ notifications, onMarkRead, onClose }) => {
  return (
    <div className="notification-dropdown">
      <div className="notif-header">
        <h3>Notificações</h3>
        <span className="notif-count">
          {notifications.filter((n) => !n.read).length} não lidas
        </span>
      </div>
      <div className="notif-list">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-item ${!notif.read ? "unread" : ""}`}
              onClick={() => onMarkRead(notif.id)}
            >
              <div className="notif-content">
                <p className="notif-title">{notif.title}</p>
                <p className="notif-message">{notif.message}</p>
                <span className="notif-time">{notif.time}</span>
              </div>
              {!notif.read && <span className="unread-indicator"></span>}
            </div>
          ))
        ) : (
          <div className="notif-empty">Nenhuma notificação por enquanto.</div>
        )}
      </div>
      <div className="notif-footer">
        <button className="view-all-btn">Ver todas</button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
