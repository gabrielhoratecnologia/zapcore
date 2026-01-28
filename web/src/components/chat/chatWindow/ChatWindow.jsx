import { useState, useEffect, useRef } from "react";
import { FaSmile, FaPaperPlane, FaInfoCircle, FaSync } from "react-icons/fa";
import EmojiPicker, { EmojiStyle, Categories } from "emoji-picker-react";
import DOMPurify from "dompurify";
import { useChatDetails } from "../../../hooks/useChatDetails.jsx";
import axios from "axios";
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

// -------- NOVO: Helpers de data --------
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
// --------------------------------------

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [tempBrideName, setTempBrideName] = useState("");
  const [tempWeddingDate, setTempWeddingDate] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const detailsRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const { details, updateGeneralDetails, addNote, loading } = useChatDetails(
    chat?.id,
  );

  const handleLoadOlder = async () => {
    if (isLoadingOlder) return;

    setIsLoadingOlder(true);
    try {
      await loadOlderMessages(chat.id, messagesContainerRef);
    } catch (err) {
      console.error("Erro ao carregar mensagens antigas", err);
    } finally {
      setIsLoadingOlder(false);
    }
  };

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

  const listenerRef = useRef(null);

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

  const handleManualRefresh = async () => {
    if (isRefreshing || !chat?.phone) return;
    setIsRefreshing(true);
    try {
      const REFRESH_URL =
        "https://southamerica-east1-zapcore-581b0.cloudfunctions.net/refreshConversation";
      await axios.get(REFRESH_URL, { params: { phone: chat.phone } });
    } catch (err) {
      console.error(err);
      alert("Erro ao sincronizar mensagens.");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!chat) {
    return (
      <div className="chat-placeholder">
        <h2>Selecione uma conversa</h2>
      </div>
    );
  }

  let lastRenderedDate = null;

  return (
    <div className="chat-active-container">
      {/* HEADER */}
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

      {/* MENSAGENS */}
      <div className="chat-messages-list" ref={messagesContainerRef}>
        {/* BOTÃO CARREGAR MAIS */}
        <div className="load-older-wrapper">
          <button
            className="load-older-btn"
            onClick={handleLoadOlder}
            disabled={isLoadingOlder}
          >
            {isLoadingOlder ? (
              <>
                <FaSync className="load-older-spinner" />
                Carregando...
              </>
            ) : (
              "Carregar mensagens anteriores"
            )}
          </button>
        </div>

        {messages.map((msg, idx) => {
          const msgDate = msg.timestamp?.toDate();
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
              autoFocusSearch={false}
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
