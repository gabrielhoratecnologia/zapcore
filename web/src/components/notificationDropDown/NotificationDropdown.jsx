import React from "react";
import "./NotificationDropdown.css";

const NotificationDropdown = ({ notifications, onMarkRead }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return "Agora";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Agora mesmo";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h atrás`;

    return date.toLocaleDateString();
  };

  return (
    <div className="notification-dropdown">
      <div className="notif-header">
        <h3>Notificações</h3>
        <span className="notif-count">
          {notifications.filter((n) => !n.read).length} novas
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
                <span className="notif-time">
                  {formatTime(notif.createdAt)}
                </span>
              </div>
              {!notif.read && <span className="unread-indicator"></span>}
            </div>
          ))
        ) : (
          <div className="notif-empty">
            <p>Sua caixa de entrada está limpa!</p>
          </div>
        )}
      </div>

      <div className="notif-footer">
        <button className="view-all-btn">Limpar lidas</button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
