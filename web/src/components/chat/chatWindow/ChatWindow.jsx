import { useState, useEffect, useRef } from "react";
import { FaSmile, FaPaperPlane } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import "./ChatWindow.css";

const MESSAGE_FROM = { AGENT: "agent", CLIENT: "client" };

const ChatWindow = ({ chat, user, messages, getMessages, sendMessage }) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    chat?.name || ""
  )}&background=random&color=fff`;

  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!chat?.id) return;
    const unsubscribe = getMessages(chat.id);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chat?.id, getMessages]);

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (newMessage.trim()) {
      await sendMessage(chat.id, newMessage);
      setNewMessage("");
      setShowEmojiPicker(false);
    }
  };

  if (!chat)
    return (
      <div className="chat-placeholder">
        <h2>Selecione uma conversa</h2>
      </div>
    );

  return (
    <div className="chat-active-container">
      <div className="chat-active-header">
        <img
          src={chat.avatar || initialsAvatar}
          alt=""
          className="header-avatar"
          onError={(e) => (e.target.src = defaultAvatar)}
        />
        <div className="header-info">
          <h4>{chat.name}</h4>
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
                {msg.createdAt
                  ?.toDate()
                  .toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className="chat-footer">
        {showEmojiPicker && (
          <div
            className="emoji-picker-wrapper anim-fade-in"
            ref={emojiPickerRef}
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              autoFocusSearch={false}
              theme="light"
              width="350px"
              height="450px"
              searchPlaceholder="Procurar emoji..."
            />
          </div>
        )}

        <div className="input-area-floating">
          <button
            type="button"
            className={`emoji-trigger-btn ${showEmojiPicker ? "active" : ""}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
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

          <button
            className="send-circle-btn"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <FaPaperPlane />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWindow;
