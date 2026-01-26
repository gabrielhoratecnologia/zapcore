import { useState, useEffect, useRef } from "react";
import { FaSmile, FaPaperPlane, FaInfoCircle, FaSync } from "react-icons/fa"; // Adicionado FaSync
import EmojiPicker, { EmojiStyle, Categories } from "emoji-picker-react";
import DOMPurify from "dompurify";
import { useChatDetails } from "../../../hooks/useChatDetails.jsx";
import axios from "axios"; // Certifique-se de ter o axios instalado
import "./ChatWindow.css";

const MESSAGE_FROM = { AGENT: "agent", CLIENT: "client" };

const formatWhatsAppText = (text) => {
  if (!text) return "";
  const rawHtml = text
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<i>$1</i>")
    .replace(/~(.*?)~/g, "<strike>$1</strike>");
  return DOMPurify.sanitize(rawHtml);
};

const ChatWindow = ({ chat, user, messages, getMessages, sendMessage }) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    chat?.name || "",
  )}&background=random&color=fff`;

  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // Estado para o loading do refresh

  const [tempBrideName, setTempBrideName] = useState("");
  const [tempWeddingDate, setTempWeddingDate] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const detailsRef = useRef(null);

  const { details, updateGeneralDetails, addNote, loading } = useChatDetails(
    chat?.id,
  );

  useEffect(() => {
    setTempBrideName(details.brideName || "");
    setTempWeddingDate(details.weddingDate || "");
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
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest(".emoji-trigger-btn")
      ) {
        setShowEmojiPicker(false);
      }
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target) &&
        !event.target.closest(".info-trigger-btn")
      ) {
        setShowDetails(false);
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
      await sendMessage(chat, newMessage);
      setNewMessage("");
      setShowEmojiPicker(false);
    }
  };

  const handleSaveDetails = async () => {
    await updateGeneralDetails(tempBrideName, tempWeddingDate);
    if (newNoteText.trim()) {
      await addNote(newNoteText);
      setNewNoteText("");
    }
    setShowDetails(false);
  };

  // --- NOVA FUNÇÃO DE REFRESH ---
  const handleManualRefresh = async () => {
    if (isRefreshing || !chat?.phone) return;

    setIsRefreshing(true);
    try {
      // Substitua pela URL real da sua Cloud Function após o deploy
      const REFRESH_URL = `https://southamerica-east1-zapcore-581b0.cloudfunctions.net/refreshConversation`;
      await axios.get(REFRESH_URL, { params: { phone: chat.phone } });
    } catch (error) {
      console.error("Erro ao sincronizar mensagens:", error);
      alert("Erro ao sincronizar mensagens.");
    } finally {
      setIsRefreshing(false);
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
          src={chat.pho || initialsAvatar}
          alt=""
          className="header-avatar"
          onError={(e) => (e.target.src = defaultAvatar)}
        />
        <div className="header-info">
          <h4>
            {details.brideName || chat.name}{" "}
            {details.weddingDate || chat.weddingDate}
          </h4>
        </div>

        <div className="header-actions">
          <button
            className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
            onClick={handleManualRefresh}
            title="Sincronizar mensagens"
            disabled={isRefreshing}
          >
            <FaSync />
          </button>

          <button
            className="info-trigger-btn"
            onClick={() => setShowDetails(!showDetails)}
          >
            <FaInfoCircle />
          </button>
        </div>
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
              {details.notes && details.notes.length > 0 ? (
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
              <p
                dangerouslySetInnerHTML={{
                  __html: formatWhatsAppText(msg.text),
                }}
              />
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
              autoFocusSearch={false}
              theme="light"
              emojiStyle={EmojiStyle.NATIVE}
              searchPlaceholder="Pesquisar emoji"
              width="350px"
              height="400px"
              previewConfig={{
                showPreview: false,
              }}
              categories={[
                { category: Categories.SUGGESTED, name: "Recentes" },
                {
                  category: Categories.SMILEYS_PEOPLE,
                  name: "Smileys e Pessoas",
                },
                {
                  category: Categories.ANIMALS_NATURE,
                  name: "Animais e Natureza",
                },
                { category: Categories.FOOD_DRINK, name: "Comida e Bebida" },
                {
                  category: Categories.TRAVEL_PLACES,
                  name: "Viagens e Lugares",
                },
                { category: Categories.ACTIVITIES, name: "Atividades" },
                { category: Categories.OBJECTS, name: "Objetos" },
                { category: Categories.SYMBOLS, name: "Símbolos" },
                { category: Categories.FLAGS, name: "Bandeiras" },
              ]}
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
        </div>
      </footer>
    </div>
  );
};

export default ChatWindow;
