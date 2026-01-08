import React from "react";
import "./ConversationItem.css";

const ConversationItem = ({ chat, active, onClick }) => {
  return (
    <div
      className={`conversation-item ${active ? "active" : ""}`}
      onClick={() => onClick(chat)}
    >
      <img src={chat.avatar} alt={chat.name} className="chat-avatar" />
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
