import React, { useState, useEffect } from "react";
import "./ConversationItem.css";

const ConversationItem = ({ chat, active, onClick, onAccept }) => {
  const [timeWaiting, setTimeWaiting] = useState("");
  const [urgencyClass, setUrgencyClass] = useState("");

  const isQueue = !chat.assignedTo;

  // Calcula o tempo de espera em tempo real
  useEffect(() => {
    if (!isQueue || !chat.updatedAt) return;

    const calculateTime = () => {
      const now = new Date();
      const diffInMs = now - chat.updatedAt.toDate();
      const diffInMins = Math.floor(diffInMs / 60000);

      if (diffInMins < 1) setTimeWaiting("Agora");
      else if (diffInMins < 60) setTimeWaiting(`${diffInMins}m`);
      else setTimeWaiting(`${Math.floor(diffInMins / 60)}h`);

      // Define a cor da urgência
      if (diffInMins > 10) setUrgencyClass("urgent-critical");
      else if (diffInMins > 5) setUrgencyClass("urgent-warning");
      else setUrgencyClass("");
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000);
    return () => clearInterval(interval);
  }, [chat.updatedAt, isQueue]);

  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    chat.name || "Cliente",
  )}&background=random&color=fff`;

  // PRIORIDADE: photo do Firebase → avatar salvo → iniciais → default
  const avatarSrc =
    chat.photo || chat.avatar || initialsAvatar || defaultAvatar;

  return (
    <div
      className={`conversation-item ${active ? "active" : ""} ${
        isQueue ? "in-queue" : ""
      }`}
      onClick={() => onClick(chat)}
    >
      <div className="avatar-wrapper">
        <img
          src={avatarSrc}
          alt={chat.name}
          className="chat-avatar"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = defaultAvatar;
          }}
        />

        {isQueue && <span className={`status-indicator ${urgencyClass}`} />}
      </div>

      <div className="chat-details">
        <div className="chat-row">
          <span className="chat-name">{chat.name}</span>
          <span className="chat-date">
            {isQueue ? "Aguardando" : chat.lastTime}
          </span>
        </div>

        <div className="chat-row">
          {isQueue ? (
            <div className="queue-info">
              <span className={`waiting-timer ${urgencyClass}`}>
                ⏳ Espera: {timeWaiting}
              </span>
              <button
                className="btn-accept"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(chat.id);
                }}
              >
                Atender
              </button>
            </div>
          ) : (
            <p className="chat-last-message">{chat.lastMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
