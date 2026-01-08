import React from "react";
import "./ChatWindow.css";

const ChatWindow = ({ chat }) => {
  if (!chat) {
    return (
      <div className="chat-placeholder">
        <h2>Selecione uma conversa</h2>
        <p>Filtre por nome da noiva ou data do evento na barra superior.</p>
      </div>
    );
  }

  return (
    <div className="chat-active-container">
      <div className="chat-active-header">
        <img src={chat.avatar} alt="" className="header-avatar" />
        <div className="header-info">
          <h4>{chat.name}</h4>
          <span>online</span>
        </div>
      </div>

      <div className="chat-messages-list">
        {chat.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`msg-row ${msg.sentByMe ? "sent" : "received"}`}
          >
            <div className="msg-bubble">
              <p>{msg.text}</p>
              <span className="msg-time">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatWindow;
