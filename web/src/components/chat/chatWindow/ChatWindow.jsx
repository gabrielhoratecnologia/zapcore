import { useState, useEffect, useRef } from "react";
import {
  FaSmile,
  FaPaperPlane,
  FaInfoCircle,
  FaComments,
} from "react-icons/fa";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";
import DOMPurify from "dompurify";
import { useChatDetails } from "../../../hooks/useChatDetails.jsx";
import "./ChatWindow.css";

const MESSAGE_FROM = { AGENT: "agent", CLIENT: "client" };

const formatWhatsAppText = (text) => {
  if (typeof text !== "string") return "";
  if (!text) return "";
  const rawHtml = text
    .replace(/\*(.*?)\*/g, "<b>$1</b>")
    .replace(/_(.*?)_/g, "<i>$1</i>")
    .replace(/~(.*?)~/g, "<strike>$1</strike>");
  return DOMPurify.sanitize(rawHtml);
};

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const getDayLabel = (date) => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "HOJE";
  if (isSameDay(date, yesterday)) return "ONTEM";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const ChatWindow = ({
  chat,
  messages,
  loadLastMessages,
  listenNewMessages,
  loadOlderMessages,
  sendMessage,
}) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const initialsAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    chat?.name || "",
  )}&background=random&color=fff`;

  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [tempBrideName, setTempBrideName] = useState("");
  const [tempWeddingDate, setTempWeddingDate] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const listenerRef = useRef(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  };

  const { details, updateGeneralDetails, addNote, loading } = useChatDetails(
    chat?.id,
  );

  useEffect(() => {
    setTempBrideName(details.brideName || "");
    setTempWeddingDate(details.weddingDate || "");
  }, [details]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!chat?.id) return;
    loadLastMessages(chat.id);
  }, [chat?.id]);

  useEffect(() => {
    if (!chat?.id) return;
    if (listenerRef.current) {
      listenerRef.current();
      listenerRef.current = null;
    }
    const unsubscribe = listenNewMessages(chat.id);
    listenerRef.current = unsubscribe;

    return () => {
      if (listenerRef.current) {
        listenerRef.current();
        listenerRef.current = null;
      }
    };
  }, [chat?.id]);

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    await sendMessage(chat, newMessage);
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleSaveDetails = async () => {
    await updateGeneralDetails(tempBrideName, tempWeddingDate);
    if (newNoteText.trim()) {
      await addNote(newNoteText);
      setNewNoteText("");
    }
    setShowDetails(false);
  };

  const handleLoadOlder = async () => {
    if (isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      if (!messages.length) {
        await loadLastMessages(chat.id, chat);
      } else {
        await loadOlderMessages(chat.id, messagesContainerRef);
      }
    } finally {
      setIsLoadingOlder(false);
    }
  };

  if (!chat) {
    return (
      <div className="chat-placeholder">
        <div className="placeholder-content">
          <div className="placeholder-icon">
            <FaComments />
          </div>
          <h2>Sua Central de Atendimento</h2>
          <p>
            Selecione uma conversa na lista lateral para visualizar o histórico
            de mensagens e detalhes do evento.
          </p>
          <div className="placeholder-divider"></div>
        </div>
      </div>
    );
  }

  let lastRenderedDate = null;

  return (
    <div className="chat-active-container">
      {/* HEADER */}
      <div className="chat-active-header">
        <img
          src={chat.photo || initialsAvatar}
          alt=""
          className="header-avatar"
          onError={(e) => (e.target.src = defaultAvatar)}
        />
        <div className="header-info">
          <h4>
            {details.brideName || chat.name}{" "}
            {details.weddingDate && ` | ${formatDate(details.weddingDate)}`}
          </h4>
        </div>
        <div className="header-actions">
          <button
            className={`info-trigger-btn ${showDetails ? "active" : ""}`}
            onClick={() => {
              setShowDetails(!showDetails);
              setShowEmojiPicker(false);
            }}
          >
            <FaInfoCircle />
          </button>
        </div>
      </div>

      {/* MODAL DE DETALHES (CORREÇÃO: Adicionado aqui) */}
      {showDetails && (
        <div className="details-popover">
          <h3>Detalhes do Cliente</h3>
          <div className="details-field">
            <label>Nome do Contato</label>
            <input
              type="text"
              value={tempBrideName}
              onChange={(e) => setTempBrideName(e.target.value)}
              placeholder="Ex: Maria Silva"
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
            <label>Nova Nota</label>
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Digite uma observação..."
              rows={3}
            />
          </div>

          {details.notes && details.notes.length > 0 && (
            <div className="notes-section">
              <label>Histórico de Notas</label>
              <div className="notes-history">
                {details.notes.map((note, i) => (
                  <div key={i} className="note-item">
                    <div className="note-content">{note.text || note}</div>
                    {note.createdAt && (
                      <span className="note-date">{note.createdAt}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="save-details-btn" onClick={handleSaveDetails}>
            Salvar Alterações
          </button>
        </div>
      )}

      {/* MENSAGENS */}
      <div className="chat-messages-list" ref={messagesContainerRef}>
        {messages.map((msg, idx) => {
          const msgDate = msg.timestamp?.toDate ? msg.timestamp.toDate() : null;
          let showDateSeparator = false;

          if (msgDate) {
            if (!lastRenderedDate || !isSameDay(msgDate, lastRenderedDate)) {
              showDateSeparator = true;
              lastRenderedDate = msgDate;
            }
          }

          return (
            <div key={msg.id || idx}>
              {showDateSeparator && msgDate && (
                <div className="date-separator">
                  <span>{getDayLabel(msgDate)}</span>
                </div>
              )}

              <div
                className={`msg-row ${msg.from === MESSAGE_FROM.AGENT ? "sent" : "received"}`}
              >
                <div className="msg-bubble">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: formatWhatsAppText(msg.text),
                    }}
                  />
                  <span className="msg-time">
                    {msgDate?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER */}
      <footer className="chat-footer">
        {showEmojiPicker && (
          <div className="emoji-picker-wrapper" ref={emojiPickerRef}>
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              emojiStyle={EmojiStyle.NATIVE}
              width="350px"
              height="400px"
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
        <div className="input-area-floating">
          <button
            type="button"
            className={`emoji-trigger-btn ${showEmojiPicker ? "active" : ""}`}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowDetails(false);
            }}
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
          <button className="send-btn" onClick={handleSendMessage}>
            <FaPaperPlane />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatWindow;
