import { useState, useEffect, useCallback } from "react";
import { FaPlus, FaSmile, FaMicrophone, FaPaperPlane } from "react-icons/fa";
import "./ChatWindow.css";

const MESSAGE_FROM = {
  AGENT: "agent",
  CLIENT: "client",
};

// Receba as funções e mensagens via props do componente pai
const ChatWindow = ({ chat, user, messages, getMessages, sendMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!chat?.id) return;

    const unsubscribe = getMessages(chat.id);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chat?.id, getMessages]);

  if (!chat) {
    return (
      <div className="chat-placeholder">
        <h2>Selecione uma conversa</h2>
        <p>Filtre por nome da noiva ou data do evento na barra superior.</p>
      </div>
    );
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage(chat.id, newMessage);
      setNewMessage("");
    }
  };

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
        {messages.map((msg, idx) => (
          <div
            key={msg.id || idx}
            className={`msg-row ${
              msg.from === MESSAGE_FROM.AGENT ? "sent" : "received"
            }`}
          >
            <div className="msg-bubble">
              <p>{msg.text}</p>
              <span className="msg-time">
                {msg.createdAt?.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className="chat-footer">
        <div className="input-area-floating">
          <button className="icon-btn">
            <FaPlus />
          </button>
          <button className="icon-btn">
            <FaSmile />
          </button>

          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Digite uma mensagem"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </form>

          {newMessage.trim() ? (
            <button className="icon-btn send-btn" onClick={handleSendMessage}>
              <FaPaperPlane />
            </button>
          ) : (
            <button className="icon-btn">
              <FaMicrophone />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ChatWindow;
