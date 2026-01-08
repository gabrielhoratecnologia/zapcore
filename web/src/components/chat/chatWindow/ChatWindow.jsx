import { useState, useEffect, useRef } from "react";
import { FaSmile, FaPaperPlane, FaInfoCircle } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { useChatDetails } from "../../../hooks/useChatDetails.jsx"; // Importe o hook
import "./ChatWindow.css";

const MESSAGE_FROM = { AGENT: "agent", CLIENT: "client" };

const ChatWindow = ({ chat, user, messages, getMessages, sendMessage }) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    chat?.name || ""
  )}&background=random&color=fff`;

  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Estados locais para edição rápida antes de salvar
  const [tempBrideName, setTempBrideName] = useState("");
  const [tempWeddingDate, setTempWeddingDate] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const detailsRef = useRef(null);

  // Integração com o Hook do Firestore
  const { details, updateGeneralDetails, addNote, loading } = useChatDetails(
    chat?.id
  );

  // Sincroniza campos temporários quando os dados do Firebase mudam
  useEffect(() => {
    setTempBrideName(details.brideName);
    setTempWeddingDate(details.weddingDate);
  }, [details]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      )
        setShowEmojiPicker(false);
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target) &&
        !event.target.closest(".info-trigger-btn")
      )
        setShowDetails(false);
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

  const handleSaveDetails = async () => {
    // 1. Atualiza nome e data
    await updateGeneralDetails(tempBrideName, tempWeddingDate);

    // 2. Se houver texto na nota, adiciona ao array
    if (newNoteText.trim()) {
      await addNote(newNoteText);
      setNewNoteText("");
    }

    setShowDetails(false);
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
          <h4>
            {details.brideName || chat.name} {" "}
            {details.weddingDate || chat.weddingDate}
          </h4>
        </div>

        <button
          className="info-trigger-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          <FaInfoCircle />
        </button>
      </div>

      {showDetails && (
        <div className="details-popover anim-fade-in" ref={detailsRef}>
          <h5>Detalhes do Evento</h5>

          <div className="details-field">
            <label>Nome do Contato</label>
            <input
              type="text"
              value={tempBrideName}
              onChange={(e) => setTempBrideName(e.target.value)}
              placeholder="Nome da noiva..."
            />
          </div>

          <div className="details-field">
            <label>Data do Evento</label>
            <input
              type="date"
              value={tempWeddingDate}
              onChange={(e) => setTempWeddingDate(e.target.value)}
            />
          </div>

          <div className="details-field">
            <label>Histórico de Notas</label>
            <div className="notes-history">
              {details.notes.length > 0 ? (
                // Mostra notas da mais recente para a mais antiga
                [...details.notes].reverse().map((note) => (
                  <div key={note.id} className="note-item">
                    <small>{note.createdAt}:</small> {note.text}
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "11px", color: "#999" }}>
                  Nenhuma nota salva.
                </p>
              )}
            </div>
          </div>

          <div className="details-field">
            <label>Adicionar Nota</label>
            <textarea
              rows="2"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Digite observações importantes..."
            />
          </div>

          <button
            className="save-details-btn"
            onClick={handleSaveDetails}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      )}

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
        <div ref={messagesEndRef} />
      </div>

      <footer className="chat-footer">
        {showEmojiPicker && (
          <div
            className="emoji-picker-wrapper anim-fade-in"
            ref={emojiPickerRef}
          >
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              width="350px"
              height="450px"
              theme="light"
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
