import React from "react";
import "./ConversationItem.css";

const ConversationItem = ({ chat, active, onClick }) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    chat.name
  )}&background=random&color=fff`;

  const handleImageError = (e) => {
    e.target.src = defaultAvatar;
  };

  return (
    <div
      className={`conversation-item ${active ? "active" : ""}`}
      onClick={() => onClick(chat)}
    >
      <img
        src={chat.avatar || initialsAvatar}
        alt={chat.name}
        className="chat-avatar"
        onError={handleImageError}
      />
      <div className="chat-details">
        <div className="chat-row">
          <span className="chat-name">{chat.name}</span>
          <span className="chat-date">{chat.lastTime}</span>
        </div>
        <div className="chat-row">
          <p className="chat-last-message">{chat.lastMsg}</p>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
